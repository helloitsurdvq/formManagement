CREATE TABLE accounts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    type_of_account ENUM('worker', 'admin') DEFAULT 'worker'
);

CREATE TABLE forms (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    form_description TEXT NULL,
    display_order INT NOT NULL DEFAULT 0,
    form_status ENUM('draft', 'active') NOT NULL DEFAULT 'draft',
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_forms_created_by FOREIGN KEY (created_by) REFERENCES accounts(id),
    INDEX idx_forms_status_order (form_status, display_order),
    INDEX idx_forms_title (title)
);

CREATE TABLE form_fields (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    form_id BIGINT UNSIGNED NOT NULL,
    label VARCHAR(255) NOT NULL,
    field_type ENUM('text', 'number', 'date', 'color', 'select') NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    max_length INT NULL,
    min_value DECIMAL(10,2) NULL,
    max_value DECIMAL(10,2) NULL,
    allow_past_date BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_form_fields_form FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    INDEX idx_form_fields_form_order (form_id, display_order),
    INDEX idx_form_fields_form_type (form_id, field_type)
);

CREATE TABLE field_options (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    field_id BIGINT UNSIGNED NOT NULL,
    option_label VARCHAR(255) NOT NULL,
    option_value VARCHAR(255) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_field_options_field FOREIGN KEY (field_id) REFERENCES form_fields(id) ON DELETE CASCADE,
    INDEX idx_field_options_field_order (field_id, display_order),
    UNIQUE KEY uk_field_option_value (field_id, option_value)
);

CREATE TABLE form_submissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    form_id BIGINT UNSIGNED NOT NULL,
    submitted_by BIGINT UNSIGNED NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_form_submissions_submitted_by FOREIGN KEY (submitted_by) REFERENCES accounts(id),
    CONSTRAINT fk_form_submissions_form FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    INDEX idx_form_submissions_form (form_id),
    INDEX idx_form_submissions_submitted_at (submitted_at)
);

CREATE TABLE submission_values (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    submission_id BIGINT UNSIGNED NOT NULL,
    field_id BIGINT UNSIGNED NOT NULL,
    value_text TEXT NULL,
    value_number DECIMAL(10,2) NULL,
    value_date DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_submission_values_submission FOREIGN KEY (submission_id) REFERENCES form_submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_values_field FOREIGN KEY (field_id) REFERENCES form_fields(id) ON DELETE CASCADE,
    UNIQUE KEY uk_submission_field (submission_id, field_id),
    INDEX idx_submission_values_submission (submission_id),
    INDEX idx_submission_values_field (field_id)
);

INSERT INTO accounts (email, password, type_of_account)
VALUES ('admin@test.com', 'admin', 'admin');

insert into accounts(email,password,type_of_account)
values ('worker@test.com','worker','worker');