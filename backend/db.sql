create database formManagement;
use formManagement;

CREATE TABLE accounts (
	id bigint unsigned auto_increment primary key,
	email varchar(255) not null,
	password varchar(255) not null,
	type_of_account enum('worker', 'admin') default 'worker' -- the admin account is only can be created in the sql server;
);

CREATE TABLE forms (
    id bigint unsigned auto_increment primary key,
    title varchar(255) not null,
    form_description text null,
    display_order int not null default 0,
    form_status enum('draft', 'active') not null default 'draft',
    created_by bigint unsigned not null,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp on update current_timestamp,
    constraint fk_forms_created_by foreign key (created_by) references accounts(id),

    index idx_forms_status_order (form_status, display_order),
    index idx_forms_title (title)
)default charset=utf8mb4;

CREATE TABLE form_fields (
    id bigint unsigned auto_increment primary key,
    form_id bigint unsigned not null,
    label varchar(255) not null,
    field_type enum('text', 'number', 'date', 'color', 'select') not null,
    display_order int not null default 0,
    is_required boolean not null default false,

    max_length int null,
    min_value decimal(10,2) null,
    max_value decimal(10,2) null,
    allow_past_date boolean not null default false,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp on update current_timestamp,
    constraint fk_form_fields_form foreign key (form_id) references forms(id) on delete cascade,

    index idx_form_fields_form_order (form_id, display_order),
    index idx_form_fields_form_type (form_id, field_type)
)default charset=utf8mb4;

CREATE TABLE field_options (
    id bigint unsigned auto_increment primary key,
    field_id bigint unsigned not null,
    option_label varchar(255) not null,
    option_value varchar(255) not null,
    display_order int not null default 0,
    created_at timestamp not null default current_timestamp,
    constraint fk_field_options_field foreign key (field_id) references form_fields(id) on delete cascade,

    index idx_field_options_field_order (field_id, display_order),
    unique key uk_field_option_value (field_id, option_value)
) default charset=utf8mb4;

create table form_submissions (
    id bigint unsigned auto_increment primary key,
    form_id bigint unsigned not null,
    submitted_by bigint unsigned not null,
    submitted_at timestamp not null default current_timestamp,
    constraint fk_form_submissions_submitted_by foreign key (submitted_by) references accounts(id),
    constraint fk_form_submissions_form foreign key (form_id) references forms(id) on delete cascade,

    index idx_form_submissions_form (form_id),
    index idx_form_submissions_submitted_at (submitted_at)
)default charset=utf8mb4;

create table submission_values (
    id bigint unsigned auto_increment primary key,
    submission_id bigint unsigned not null,
    field_id bigint unsigned not null,
    value_text text null,
    value_number decimal(10,2) null,
    value_date date null,
    created_at timestamp not null default current_timestamp,
    constraint fk_submission_values_submission foreign key (submission_id) references form_submissions(id) on delete cascade,
    constraint fk_submission_values_field foreign key (field_id) references form_fields(id) on delete cascade,

    unique key uk_submission_field (submission_id, field_id),
    index idx_submission_values_submission (submission_id),
    index idx_submission_values_field (field_id)
)default charset=utf8mb4;

insert into accounts(email,password,type_of_account)
values ('admin@test.com','admin','admin');

select * from accounts;
select * from forms;
select * from form_fields;
select * from field_options;
select * from form_submissions;
select * from submission_values;

drop table accounts;
drop table forms;
drop table form_fields;
drop table form_submissions;
drop table submission_values;