-- =========================================
-- 1. ENUMS
-- =========================================

create type public.user_role as enum (
  'manager',
  'performer'
);

create type public.task_status as enum (
  'new',
  'in_progress',
  'review',
  'accepted',
  'rework'
);


-- =========================================
-- 2. PROFILES
-- =========================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.user_role not null default 'performer',
  created_at timestamptz not null default now()
);


-- =========================================
-- 3. OBJECTS
-- =========================================

create table public.objects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================
-- 4. TASKS
-- =========================================

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  object_id uuid not null references public.objects(id) on delete cascade,
  assignee_id uuid not null references public.profiles(id),
  author_id uuid not null references public.profiles(id),
  status public.task_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_assignee_id_idx
  on public.tasks(assignee_id);

create index tasks_object_id_idx
  on public.tasks(object_id);


-- =========================================
-- 5. TASK STATUS HISTORY
-- =========================================

create table public.task_status_history (
  id uuid primary key default gen_random_uuid(),

  -- Без FK на tasks, чтобы история сохранялась
  -- после удаления задачи.
  task_id uuid not null,

  from_status public.task_status,
  to_status public.task_status not null,

  changed_by uuid not null references public.profiles(id),
  comment text,
  created_at timestamptz not null default now()
);

create index task_history_task_id_idx
  on public.task_status_history(task_id);


-- =========================================
-- 6. USER ROLE HELPERS
-- SECURITY DEFINER avoids RLS recursion
-- =========================================

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid())
  limit 1;
$$;


create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_user_role() = 'manager',
    false
  );
$$;


-- =========================================
-- 7. UPDATED AT
-- =========================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();

  return new;
end;
$$;


create trigger objects_updated_at
before update on public.objects
for each row
execute function public.set_updated_at();


create trigger tasks_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();


-- =========================================
-- 8. TASK BUSINESS RULES
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


  -- =====================================
  -- Validate assigned performer
  -- Проверяется при создании задачи
  -- и при любом изменении исполнителя.
  -- =====================================

  if not exists (
    select 1
    from public.profiles
    where id = new.assignee_id
      and role = 'performer'
  ) then
    raise exception 'Assigned user must be a performer';
  end if;


  -- =====================================
  -- Task creation
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

    -- Сохраняем начальный статус задачи.
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
  -- Performers cannot edit task details
  -- =====================================

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
  -- Validate status transitions
  -- =====================================

  if new.status is distinct from old.status then

    v_comment := nullif(
      current_setting('app.transition_comment', true),
      ''
    );


    -- Performer transitions

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


    -- Manager transitions

    elsif v_role = 'manager' then

      if not (
        old.status = 'review'
        and new.status in ('accepted', 'rework')
      ) then
        raise exception 'Invalid manager status transition';
      end if;

    end if;


    -- Comment is required for rework

    if new.status = 'rework'
      and (
        v_comment is null
        or length(trim(v_comment)) = 0
      )
    then
      raise exception 'Comment is required for rework';
    end if;


    -- Save status history

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


create trigger validate_task_changes
before insert or update on public.tasks
for each row
execute function public.validate_task_changes();


-- =========================================
-- 9. SECURE STATUS TRANSITION
-- =========================================

create or replace function public.transition_task(
  p_task_id uuid,
  p_new_status public.task_status,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin

  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  perform set_config(
    'app.transition_comment',
    coalesce(p_comment, ''),
    true
  );

  update public.tasks
  set status = p_new_status
  where id = p_task_id;

  if not found then
    raise exception 'Task not found or access denied';
  end if;

end;
$$;


-- =========================================
-- 10. RLS
-- =========================================

alter table public.profiles enable row level security;
alter table public.objects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_status_history enable row level security;


-- =========================================
-- PROFILES
-- =========================================

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or public.is_manager()
);


-- =========================================
-- OBJECTS
-- =========================================

create policy "Managers can read all objects"
on public.objects
for select
to authenticated
using (
  public.is_manager()
);


create policy "Performers can read assigned objects"
on public.objects
for select
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    where t.object_id = objects.id
      and t.assignee_id = (select auth.uid())
  )
);


create policy "Managers can insert objects"
on public.objects
for insert
to authenticated
with check (
  public.is_manager()
  and created_by = (select auth.uid())
);


create policy "Managers can update objects"
on public.objects
for update
to authenticated
using (
  public.is_manager()
)
with check (
  public.is_manager()
);


create policy "Managers can delete objects"
on public.objects
for delete
to authenticated
using (
  public.is_manager()
);


-- =========================================
-- TASKS
-- =========================================

create policy "Users can read permitted tasks"
on public.tasks
for select
to authenticated
using (
  public.is_manager()
  or assignee_id = (select auth.uid())
);


create policy "Managers can create tasks"
on public.tasks
for insert
to authenticated
with check (
  public.is_manager()
);


create policy "Users can update permitted tasks"
on public.tasks
for update
to authenticated
using (
  public.is_manager()
  or assignee_id = (select auth.uid())
)
with check (
  public.is_manager()
  or assignee_id = (select auth.uid())
);


create policy "Managers can delete tasks"
on public.tasks
for delete
to authenticated
using (
  public.is_manager()
);


-- =========================================
-- TASK STATUS HISTORY
-- =========================================

create policy "Users can read permitted task history"
on public.task_status_history
for select
to authenticated
using (
  public.is_manager()
  or exists (
    select 1
    from public.tasks t
    where t.id = task_status_history.task_id
      and t.assignee_id = (select auth.uid())
  )
);


-- =========================================
-- 11. GRANTS AND REVOKES
-- =========================================

grant usage on schema public to authenticated;


-- PROFILES

grant select on public.profiles to authenticated;

-- Клиент не может создавать, изменять
-- или удалять профили и назначать роли.
revoke insert, update, delete
on public.profiles
from anon, authenticated;


-- OBJECTS

grant select, insert, update, delete
on public.objects
to authenticated;


-- TASKS

grant select, insert, delete
on public.tasks
to authenticated;

-- Разрешаем изменение только полей задачи.
-- Статус изменяется исключительно через RPC.
grant update (
  title,
  description,
  object_id,
  assignee_id
)
on public.tasks
to authenticated;

revoke update
on public.tasks
from anon, authenticated;


-- Повторно выдаём разрешение на конкретные поля.
grant update (
  title,
  description,
  object_id,
  assignee_id
)
on public.tasks
to authenticated;


-- TASK STATUS HISTORY

grant select
on public.task_status_history
to authenticated;

-- Историю нельзя изменять напрямую через API.
revoke insert, update, delete
on public.task_status_history
from anon, authenticated;


-- TRANSITION RPC

revoke all
on function public.transition_task(
  uuid,
  public.task_status,
  text
)
from public, anon;

grant execute
on function public.transition_task(
  uuid,
  public.task_status,
  text
)
to authenticated;


-- ROLE HELPERS

revoke all
on function public.current_user_role()
from public;

revoke all
on function public.is_manager()
from public;

grant execute
on function public.current_user_role()
to authenticated;

grant execute
on function public.is_manager()
to authenticated;