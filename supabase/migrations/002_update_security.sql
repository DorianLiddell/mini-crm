begin;


-- =========================================
-- 1. TASK STATUS HISTORY
-- =========================================

-- Убираем внешний ключ на tasks.
-- История должна сохраняться после удаления задачи.

alter table public.task_status_history
  drop constraint if exists task_status_history_task_id_fkey;


-- =========================================
-- 2. VALIDATE TASK CHANGES
-- =========================================

create or replace function public.validate_task_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
  v_comment text;
begin
  v_role := public.current_user_role();

  if v_role is null then
    raise exception 'User role not found';
  end if;


  -- Проверяем исполнителя при создании задачи
  -- и при последующем переназначении.

  if not exists (
    select 1
    from public.profiles
    where id = new.assignee_id
      and role = 'performer'
  ) then
    raise exception 'Assigned user must be a performer';
  end if;


  -- =====================================
  -- INSERT
  -- =====================================

  if tg_op = 'INSERT' then

    if v_role <> 'manager' then
      raise exception 'Only managers can create tasks';
    end if;

    if new.status <> 'new' then
      raise exception 'New tasks must have status new';
    end if;

    if new.author_id <> (select auth.uid()) then
      raise exception 'Invalid task author';
    end if;

    -- Записываем начальный статус.

    insert into public.task_status_history (
      task_id,
      from_status,
      to_status,
      changed_by,
      comment
    )
    values (
      new.id,
      null,
      new.status,
      (select auth.uid()),
      null
    );

    return new;
  end if;


  -- =====================================
  -- UPDATE
  -- =====================================

  -- Исполнитель не может редактировать
  -- основные данные задачи.

  if v_role = 'performer' then

    if new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.object_id is distinct from old.object_id
      or new.assignee_id is distinct from old.assignee_id
      or new.author_id is distinct from old.author_id
      or new.created_at is distinct from old.created_at
    then
      raise exception 'Performers cannot edit task details';
    end if;

    if old.assignee_id <> (select auth.uid()) then
      raise exception 'You are not assigned to this task';
    end if;

  end if;


  -- =====================================
  -- STATUS TRANSITIONS
  -- =====================================

  if new.status is distinct from old.status then

    v_comment := nullif(
      current_setting('app.transition_comment', true),
      ''
    );


    -- Переходы исполнителя.

    if v_role = 'performer' then

      if not (
        (old.status = 'new' and new.status = 'in_progress')
        or
        (old.status = 'in_progress' and new.status = 'review')
        or
        (old.status = 'rework' and new.status = 'in_progress')
      ) then
        raise exception 'Invalid performer status transition';
      end if;


    -- Переходы постановщика.

    elsif v_role = 'manager' then

      if not (
        old.status = 'review'
        and new.status in ('accepted', 'rework')
      ) then
        raise exception 'Invalid manager status transition';
      end if;

    end if;


    -- Для возврата на доработку
    -- обязательно нужен комментарий.

    if new.status = 'rework'
      and (
        v_comment is null
        or length(trim(v_comment)) = 0
      )
    then
      raise exception 'Comment is required for rework';
    end if;


    -- Сохраняем историю перехода.

    insert into public.task_status_history (
      task_id,
      from_status,
      to_status,
      changed_by,
      comment
    )
    values (
      new.id,
      old.status,
      new.status,
      (select auth.uid()),
      v_comment
    );

  end if;


  return new;
end;
$$;


-- =========================================
-- 3. PROFILES SECURITY
-- =========================================

-- Клиент не может создавать, изменять
-- или удалять профили и назначать роли.

revoke insert, update, delete
on public.profiles
from public, anon, authenticated;

-- Чтение профилей остаётся разрешённым
-- в соответствии с RLS.

grant select
on public.profiles
to authenticated;


-- =========================================
-- 4. TASK STATUS HISTORY SECURITY
-- =========================================

-- Историю нельзя изменять напрямую через API.

revoke insert, update, delete
on public.task_status_history
from public, anon, authenticated;

grant select
on public.task_status_history
to authenticated;


-- =========================================
-- 5. TASK UPDATE SECURITY
-- =========================================

-- Сначала отзываем общее право UPDATE.

revoke update
on public.tasks
from public, anon, authenticated;

-- Затем разрешаем изменение только
-- определённых полей задачи.

grant update (
  title,
  description,
  object_id,
  assignee_id
)
on public.tasks
to authenticated;


-- =========================================
-- 6. TRANSITION RPC SECURITY
-- =========================================

-- Закрываем доступ к функции по умолчанию.

revoke all
on function public.transition_task(
  uuid,
  public.task_status,
  text
)
from public, anon;

-- Разрешаем вызов авторизованным пользователям.

grant execute
on function public.transition_task(
  uuid,
  public.task_status,
  text
)
to authenticated;


commit;