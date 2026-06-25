--
-- PostgreSQL database dump
--

\restrict HmDLjDtbHtzsNNgLtjgzOVZLxE5nOg2aKpcL3JGcCQweOknUPWPxE6RZ6rhYlkE

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_carry_forwards_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_carry_forwards_status AS ENUM (
    'pending',
    'cleared',
    'written_off'
);


ALTER TYPE public.enum_carry_forwards_status OWNER TO postgres;

--
-- Name: enum_categories_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_categories_status AS ENUM (
    'Active',
    'Inactive'
);


ALTER TYPE public.enum_categories_status OWNER TO postgres;

--
-- Name: enum_deduction_applications_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_deduction_applications_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'applied'
);


ALTER TYPE public.enum_deduction_applications_status OWNER TO postgres;

--
-- Name: enum_employee_documents_document_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_employee_documents_document_type AS ENUM (
    'id_card',
    'cv',
    'degree',
    'guarantee_letter',
    'resume',
    'id-card',
    'passport',
    'certificate',
    'contract',
    'performance-review',
    'child_profile',
    'child_birth_certificate',
    'child_medical_report',
    'child_adoption_certificate',
    'profile_picture',
    'education_certificate',
    'training_certificate',
    'experience_letter',
    'sdt_letter',
    'national_id',
    'naturalization_certificate',
    'health_document',
    'legal_document',
    'spouse_profile',
    'marriage_certificate'
);


ALTER TYPE public.enum_employee_documents_document_type OWNER TO postgres;

--
-- Name: enum_employee_documents_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_employee_documents_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.enum_employee_documents_status OWNER TO postgres;

--
-- Name: enum_employee_penalties_calculation_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_employee_penalties_calculation_type AS ENUM (
    'fixed',
    'percent'
);


ALTER TYPE public.enum_employee_penalties_calculation_type OWNER TO postgres;

--
-- Name: enum_employee_penalties_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_employee_penalties_status AS ENUM (
    'active',
    'applied',
    'cancelled',
    'reduced'
);


ALTER TYPE public.enum_employee_penalties_status OWNER TO postgres;

--
-- Name: enum_employees_employment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_employees_employment_status AS ENUM (
    'active',
    'inactive',
    'on-leave',
    'terminated',
    'retired'
);


ALTER TYPE public.enum_employees_employment_status OWNER TO postgres;

--
-- Name: enum_employees_employment_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_employees_employment_type AS ENUM (
    'full-time',
    'part-time',
    'contract',
    'intern'
);


ALTER TYPE public.enum_employees_employment_type OWNER TO postgres;

--
-- Name: enum_employees_gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_employees_gender AS ENUM (
    'male',
    'female',
    'other'
);


ALTER TYPE public.enum_employees_gender OWNER TO postgres;

--
-- Name: enum_employees_marital_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_employees_marital_status AS ENUM (
    'single',
    'married',
    'divorced',
    'widowed'
);


ALTER TYPE public.enum_employees_marital_status OWNER TO postgres;

--
-- Name: enum_employees_shift_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_employees_shift_type AS ENUM (
    'day',
    'night'
);


ALTER TYPE public.enum_employees_shift_type OWNER TO postgres;

--
-- Name: enum_groups_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_groups_status AS ENUM (
    'Active',
    'Inactive'
);


ALTER TYPE public.enum_groups_status OWNER TO postgres;

--
-- Name: enum_items_spec_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_items_spec_type AS ENUM (
    'text',
    'pdf'
);


ALTER TYPE public.enum_items_spec_type OWNER TO postgres;

--
-- Name: enum_items_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_items_status AS ENUM (
    'Active',
    'Inactive',
    'Discontinued'
);


ALTER TYPE public.enum_items_status OWNER TO postgres;

--
-- Name: enum_leave_extensions_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_leave_extensions_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.enum_leave_extensions_status OWNER TO postgres;

--
-- Name: enum_leave_notifications_channel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_leave_notifications_channel AS ENUM (
    'email',
    'sms',
    'in_app'
);


ALTER TYPE public.enum_leave_notifications_channel OWNER TO postgres;

--
-- Name: enum_leave_notifications_notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_leave_notifications_notification_type AS ENUM (
    'reminder',
    'overdue',
    'expiry',
    'approval',
    'rejection',
    'extension_approved',
    'extension_rejected'
);


ALTER TYPE public.enum_leave_notifications_notification_type OWNER TO postgres;

--
-- Name: enum_leave_notifications_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_leave_notifications_status AS ENUM (
    'sent',
    'delivered',
    'failed',
    'read'
);


ALTER TYPE public.enum_leave_notifications_status OWNER TO postgres;

--
-- Name: enum_leave_requests_return_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_leave_requests_return_status AS ENUM (
    'on_leave',
    'returned',
    'returned_late',
    'overdue'
);


ALTER TYPE public.enum_leave_requests_return_status OWNER TO postgres;

--
-- Name: enum_leave_requests_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_leave_requests_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);


ALTER TYPE public.enum_leave_requests_status OWNER TO postgres;

--
-- Name: enum_leave_types_gender_restriction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_leave_types_gender_restriction AS ENUM (
    'male',
    'female',
    'none'
);


ALTER TYPE public.enum_leave_types_gender_restriction OWNER TO postgres;

--
-- Name: enum_payment_sessions_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_payment_sessions_status AS ENUM (
    'active',
    'closed',
    'expired'
);


ALTER TYPE public.enum_payment_sessions_status OWNER TO postgres;

--
-- Name: enum_payment_transactions_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_payment_transactions_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'returned'
);


ALTER TYPE public.enum_payment_transactions_status OWNER TO postgres;

--
-- Name: enum_payroll_periods_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_payroll_periods_status AS ENUM (
    'draft',
    'processing',
    'processed',
    'paid',
    'closed'
);


ALTER TYPE public.enum_payroll_periods_status OWNER TO postgres;

--
-- Name: enum_payroll_processing_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_payroll_processing_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


ALTER TYPE public.enum_payroll_processing_status OWNER TO postgres;

--
-- Name: enum_penalty_deductions_deduction_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_penalty_deductions_deduction_type AS ENUM (
    'percent_reduction',
    'amount_reduction',
    'full_reduction'
);


ALTER TYPE public.enum_penalty_deductions_deduction_type OWNER TO postgres;

--
-- Name: enum_penalty_reduction_rules_rule_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_penalty_reduction_rules_rule_type AS ENUM (
    'amount',
    'percent'
);


ALTER TYPE public.enum_penalty_reduction_rules_rule_type OWNER TO postgres;

--
-- Name: enum_penalty_summaries_penalty_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_penalty_summaries_penalty_type AS ENUM (
    'percent',
    'asset',
    'other'
);


ALTER TYPE public.enum_penalty_summaries_penalty_type OWNER TO postgres;

--
-- Name: enum_penalty_summaries_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_penalty_summaries_status AS ENUM (
    'active',
    'partially_deducted',
    'fully_deducted',
    'cancelled'
);


ALTER TYPE public.enum_penalty_summaries_status OWNER TO postgres;

--
-- Name: enum_recurring_deductions_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_recurring_deductions_status AS ENUM (
    'active',
    'completed',
    'cancelled'
);


ALTER TYPE public.enum_recurring_deductions_status OWNER TO postgres;

--
-- Name: enum_returned_payments_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_returned_payments_status AS ENUM (
    'pending',
    'resolved',
    'written_off'
);


ALTER TYPE public.enum_returned_payments_status OWNER TO postgres;

--
-- Name: enum_salary_holds_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_salary_holds_status AS ENUM (
    'active',
    'released',
    'partially_released'
);


ALTER TYPE public.enum_salary_holds_status OWNER TO postgres;

--
-- Name: enum_stores_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_stores_status AS ENUM (
    'Active',
    'Inactive',
    'Closed'
);


ALTER TYPE public.enum_stores_status OWNER TO postgres;

--
-- Name: enum_system_settings_data_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_system_settings_data_type AS ENUM (
    'json',
    'string',
    'number',
    'boolean',
    'array'
);


ALTER TYPE public.enum_system_settings_data_type OWNER TO postgres;

--
-- Name: enum_unclaimed_salaries_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_unclaimed_salaries_status AS ENUM (
    'unclaimed',
    'claimed',
    'written_off'
);


ALTER TYPE public.enum_unclaimed_salaries_status OWNER TO postgres;

--
-- Name: enum_uom_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.enum_uom_status AS ENUM (
    'Active',
    'Inactive'
);


ALTER TYPE public.enum_uom_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO postgres;

--
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_records (
    id integer NOT NULL,
    import_batch_id integer NOT NULL,
    employee_id integer NOT NULL,
    late_minutes integer DEFAULT 0,
    half_day_absence numeric DEFAULT 0,
    early_leave_days numeric DEFAULT 0,
    imported_dates jsonb,
    absence_days numeric DEFAULT 0,
    normal_ot_minutes integer DEFAULT 0,
    weekend_ot_minutes integer DEFAULT 0,
    holiday_ot_minutes integer DEFAULT 0,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    period_days integer,
    raw_data jsonb,
    is_valid boolean DEFAULT true,
    validation_errors text,
    created_at timestamp with time zone,
    period_year integer,
    period_month integer,
    updated_at timestamp with time zone
);


ALTER TABLE public.attendance_records OWNER TO postgres;

--
-- Name: attendance_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_records_id_seq OWNER TO postgres;

--
-- Name: attendance_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_records_id_seq OWNED BY public.attendance_records.id;


--
-- Name: carry_forwards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carry_forwards (
    carry_id integer NOT NULL,
    employee_id integer NOT NULL,
    period_id integer NOT NULL,
    amount numeric NOT NULL,
    status public.enum_carry_forwards_status DEFAULT 'pending'::public.enum_carry_forwards_status,
    cleared_in_period_id integer,
    cleared_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone
);


ALTER TABLE public.carry_forwards OWNER TO postgres;

--
-- Name: carry_forwards_carry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.carry_forwards_carry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.carry_forwards_carry_id_seq OWNER TO postgres;

--
-- Name: carry_forwards_carry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.carry_forwards_carry_id_seq OWNED BY public.carry_forwards.carry_id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status public.enum_categories_status DEFAULT 'Active'::public.enum_categories_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: compensation_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compensation_history (
    history_id integer NOT NULL,
    employee_id integer NOT NULL,
    component_type character varying(255),
    old_value numeric,
    new_value numeric,
    change_percent numeric,
    effective_date date NOT NULL,
    reason text,
    approved_by integer,
    created_at timestamp with time zone
);


ALTER TABLE public.compensation_history OWNER TO postgres;

--
-- Name: compensation_history_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.compensation_history_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compensation_history_history_id_seq OWNER TO postgres;

--
-- Name: compensation_history_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.compensation_history_history_id_seq OWNED BY public.compensation_history.history_id;


--
-- Name: deduction_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deduction_applications (
    application_id integer NOT NULL,
    deduction_id integer NOT NULL,
    period_id integer NOT NULL,
    employee_id integer NOT NULL,
    amount_applied numeric NOT NULL,
    submitted_by integer,
    submitted_by_name character varying(255),
    contact character varying(255),
    reason text,
    notes text,
    application_date date,
    status public.enum_deduction_applications_status DEFAULT 'applied'::public.enum_deduction_applications_status,
    approval_reference character varying(255),
    is_partial boolean DEFAULT false,
    original_amount numeric,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.deduction_applications OWNER TO postgres;

--
-- Name: deduction_applications_application_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.deduction_applications_application_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deduction_applications_application_id_seq OWNER TO postgres;

--
-- Name: deduction_applications_application_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.deduction_applications_application_id_seq OWNED BY public.deduction_applications.application_id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    department_id integer NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    manager_id integer,
    parent_department_id integer,
    budget numeric DEFAULT 0,
    location character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_department_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_department_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_department_id_seq OWNER TO postgres;

--
-- Name: departments_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_department_id_seq OWNED BY public.departments.department_id;


--
-- Name: employee_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_documents (
    document_id integer NOT NULL,
    employee_id integer NOT NULL,
    document_type public.enum_employee_documents_document_type NOT NULL,
    document_name character varying(255) NOT NULL,
    file_url character varying(255) NOT NULL,
    file_size integer,
    mime_type character varying(255),
    uploaded_by integer,
    expiry_date date,
    status public.enum_employee_documents_status DEFAULT 'pending'::public.enum_employee_documents_status,
    notes text,
    is_active boolean DEFAULT true,
    sub_type character varying(255),
    index integer,
    description text,
    metadata jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.employee_documents OWNER TO postgres;

--
-- Name: employee_documents_document_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_documents_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_documents_document_id_seq OWNER TO postgres;

--
-- Name: employee_documents_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_documents_document_id_seq OWNED BY public.employee_documents.document_id;


--
-- Name: employee_penalties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_penalties (
    penalty_id integer NOT NULL,
    employee_id integer NOT NULL,
    period_id integer,
    penalty_type character varying(255) NOT NULL,
    calculation_type public.enum_employee_penalties_calculation_type DEFAULT 'fixed'::public.enum_employee_penalties_calculation_type,
    value numeric NOT NULL,
    calculated_amount numeric,
    reference character varying(255),
    submitted_by character varying(255),
    contact character varying(255),
    reason text,
    month character varying(255) NOT NULL,
    status public.enum_employee_penalties_status DEFAULT 'active'::public.enum_employee_penalties_status,
    original_value numeric,
    reduction_reason text,
    reduced_by character varying(255),
    reduced_at timestamp with time zone,
    created_by integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    penalty_date date,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    period_label character varying(255),
    reduced_amount numeric DEFAULT 0
);


ALTER TABLE public.employee_penalties OWNER TO postgres;

--
-- Name: employee_penalties_penalty_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_penalties_penalty_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_penalties_penalty_id_seq OWNER TO postgres;

--
-- Name: employee_penalties_penalty_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_penalties_penalty_id_seq OWNED BY public.employee_penalties.penalty_id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    employee_id integer NOT NULL,
    employee_code character varying(255) NOT NULL,
    user_id integer NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    middle_name character varying(255),
    full_name_english character varying(255),
    date_of_birth_ec character varying(255),
    date_of_birth_gc date,
    gender public.enum_employees_gender,
    marital_status public.enum_employees_marital_status,
    nationality character varying(255),
    national_id character varying(255),
    national_id_document jsonb,
    work_email character varying(255),
    personal_email character varying(255),
    phone_number character varying(255),
    current_address jsonb,
    permanent_address jsonb,
    birth_place jsonb,
    work_location character varying(255),
    current_company jsonb,
    department_id integer,
    position_id integer,
    manager_id integer,
    employment_type public.enum_employees_employment_type DEFAULT 'full-time'::public.enum_employees_employment_type,
    employment_status public.enum_employees_employment_status DEFAULT 'active'::public.enum_employees_employment_status,
    hire_date_ec character varying(255),
    hire_date_gc date,
    confirmation_date_ec character varying(255),
    confirmation_date_gc date,
    termination_date_ec character varying(255),
    termination_date_gc date,
    shift_type public.enum_employees_shift_type DEFAULT 'day'::public.enum_employees_shift_type,
    basic_salary numeric DEFAULT 0,
    housing_allowance numeric DEFAULT 0,
    position_allowance numeric DEFAULT 0,
    transport_allowance numeric DEFAULT 0,
    mobile_allowance numeric DEFAULT 0,
    bank_account jsonb,
    emergency_contact jsonb,
    emergency_contact_address jsonb,
    mothers_full_name character varying(255),
    spouse_info jsonb,
    children jsonb,
    parents_info jsonb,
    parent_support jsonb,
    education jsonb,
    training jsonb,
    work_experience jsonb,
    language_skills jsonb,
    other_skills text,
    nationality_acquisition jsonb,
    health_info jsonb,
    legal_info jsonb,
    guarantee_info jsonb,
    profile_picture character varying(255),
    profile_picture_url character varying(255),
    profile_picture_public_id character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_employee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_employee_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_employee_id_seq OWNER TO postgres;

--
-- Name: employees_employee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_employee_id_seq OWNED BY public.employees.employee_id;


--
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status public.enum_groups_status DEFAULT 'Active'::public.enum_groups_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.groups_id_seq OWNER TO postgres;

--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- Name: hold_releases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hold_releases (
    release_id integer NOT NULL,
    hold_id integer NOT NULL,
    release_type character varying(255),
    release_percent numeric,
    release_amount numeric,
    release_reason text,
    released_by integer,
    released_at timestamp with time zone,
    applied_to_period_id integer,
    created_at timestamp with time zone
);


ALTER TABLE public.hold_releases OWNER TO postgres;

--
-- Name: hold_releases_release_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hold_releases_release_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hold_releases_release_id_seq OWNER TO postgres;

--
-- Name: hold_releases_release_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hold_releases_release_id_seq OWNED BY public.hold_releases.release_id;


--
-- Name: import_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.import_batches (
    id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(255),
    import_date timestamp with time zone,
    period_start date,
    period_end date,
    period_type character varying(255),
    total_rows integer DEFAULT 0,
    success_rows integer DEFAULT 0,
    error_rows integer DEFAULT 0,
    status character varying(255) DEFAULT 'processing'::character varying,
    imported_by integer,
    notes text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.import_batches OWNER TO postgres;

--
-- Name: import_batches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.import_batches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.import_batches_id_seq OWNER TO postgres;

--
-- Name: import_batches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.import_batches_id_seq OWNED BY public.import_batches.id;


--
-- Name: import_errors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.import_errors (
    id integer NOT NULL,
    import_batch_id integer NOT NULL,
    row_number integer,
    employee_id integer,
    error_type character varying(255),
    error_message text,
    raw_data jsonb,
    is_resolved boolean DEFAULT false,
    created_at timestamp with time zone,
    resolved_at timestamp with time zone,
    resolution_notes text
);


ALTER TABLE public.import_errors OWNER TO postgres;

--
-- Name: import_errors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.import_errors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.import_errors_id_seq OWNER TO postgres;

--
-- Name: import_errors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.import_errors_id_seq OWNED BY public.import_errors.id;


--
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    id integer NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    standard_name character varying(255),
    description text,
    brand character varying(255),
    model character varying(255),
    barcode character varying(255),
    category_id integer,
    uom_id integer NOT NULL,
    conversion_uom_id integer,
    conversion_value numeric DEFAULT 0 NOT NULL,
    cost_price numeric DEFAULT 0 NOT NULL,
    status public.enum_items_status DEFAULT 'Active'::public.enum_items_status NOT NULL,
    spec_type public.enum_items_spec_type DEFAULT 'text'::public.enum_items_spec_type NOT NULL,
    spec_text text,
    spec_pdf_name character varying(255),
    spec_pdf_size character varying(255),
    spec_pdf_url text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.items OWNER TO postgres;

--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.items_id_seq OWNER TO postgres;

--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: leave_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_balances (
    leave_balance_id integer NOT NULL,
    employee_id integer NOT NULL,
    year integer NOT NULL,
    years_of_service integer DEFAULT 0,
    yearly_entitlement integer DEFAULT 16,
    carried_over integer DEFAULT 0,
    carried_over_from_year integer,
    carried_over_expiry_date date,
    total_allocation integer DEFAULT 16,
    used_this_year integer DEFAULT 0,
    pending_days integer DEFAULT 0,
    available_days integer DEFAULT 16,
    sick_used_this_year integer DEFAULT 0,
    sick_alert_sent boolean DEFAULT false,
    maternity_used boolean DEFAULT false,
    maternity_used_date date,
    paternity_used boolean DEFAULT false,
    paternity_used_date date,
    bereavement_used_this_year integer DEFAULT 0,
    unpaid_used_this_year integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.leave_balances OWNER TO postgres;

--
-- Name: leave_balances_leave_balance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_balances_leave_balance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_balances_leave_balance_id_seq OWNER TO postgres;

--
-- Name: leave_balances_leave_balance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_balances_leave_balance_id_seq OWNED BY public.leave_balances.leave_balance_id;


--
-- Name: leave_extensions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_extensions (
    extension_id integer NOT NULL,
    leave_request_id integer NOT NULL,
    requested_date date,
    original_end_date date NOT NULL,
    additional_days integer NOT NULL,
    requested_new_end_date date NOT NULL,
    reason text NOT NULL,
    status public.enum_leave_extensions_status DEFAULT 'pending'::public.enum_leave_extensions_status,
    approved_by integer,
    approved_date date,
    rejection_reason text,
    rejected_by integer,
    rejected_date date,
    new_end_date date,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.leave_extensions OWNER TO postgres;

--
-- Name: leave_extensions_extension_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_extensions_extension_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_extensions_extension_id_seq OWNER TO postgres;

--
-- Name: leave_extensions_extension_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_extensions_extension_id_seq OWNED BY public.leave_extensions.extension_id;


--
-- Name: leave_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_notifications (
    notification_id integer NOT NULL,
    employee_id integer NOT NULL,
    leave_request_id integer,
    notification_type public.enum_leave_notifications_notification_type NOT NULL,
    channel public.enum_leave_notifications_channel DEFAULT 'email'::public.enum_leave_notifications_channel,
    subject character varying(255),
    message text NOT NULL,
    sent_date timestamp with time zone,
    read_at timestamp with time zone,
    status public.enum_leave_notifications_status DEFAULT 'sent'::public.enum_leave_notifications_status,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.leave_notifications OWNER TO postgres;

--
-- Name: leave_notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_notifications_notification_id_seq OWNER TO postgres;

--
-- Name: leave_notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_notifications_notification_id_seq OWNED BY public.leave_notifications.notification_id;


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_requests (
    leave_request_id integer NOT NULL,
    employee_id integer NOT NULL,
    department_id integer,
    leave_type_id integer NOT NULL,
    leave_type_name character varying(255),
    start_date date NOT NULL,
    end_date date NOT NULL,
    return_date date,
    total_days integer NOT NULL,
    reason text,
    status public.enum_leave_requests_status DEFAULT 'pending'::public.enum_leave_requests_status,
    requested_date date,
    approved_by integer,
    approved_date date,
    approval_notes text,
    rejection_reason text,
    rejected_by integer,
    rejected_date date,
    hr_notes text,
    return_status public.enum_leave_requests_return_status DEFAULT 'on_leave'::public.enum_leave_requests_return_status,
    actual_return_date date,
    days_late integer DEFAULT 0,
    return_confirmed_by integer,
    return_confirmed_date date,
    extension_count integer DEFAULT 0,
    total_extension_days integer DEFAULT 0,
    last_extended_date date,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.leave_requests OWNER TO postgres;

--
-- Name: leave_requests_leave_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_requests_leave_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_requests_leave_request_id_seq OWNER TO postgres;

--
-- Name: leave_requests_leave_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_requests_leave_request_id_seq OWNED BY public.leave_requests.leave_request_id;


--
-- Name: leave_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_types (
    leave_type_id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(255) NOT NULL,
    description text,
    default_days integer,
    is_paid boolean DEFAULT true,
    has_fixed_limit boolean DEFAULT true,
    is_one_time boolean DEFAULT false,
    requires_approval boolean DEFAULT true,
    min_notice_days integer DEFAULT 0,
    max_consecutive_days integer,
    requires_documentation boolean DEFAULT false,
    gender_restriction public.enum_leave_types_gender_restriction DEFAULT 'none'::public.enum_leave_types_gender_restriction,
    carry_over_limit integer DEFAULT 10,
    carry_over_expiry_years integer DEFAULT 2,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.leave_types OWNER TO postgres;

--
-- Name: leave_types_leave_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_types_leave_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_types_leave_type_id_seq OWNER TO postgres;

--
-- Name: leave_types_leave_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_types_leave_type_id_seq OWNED BY public.leave_types.leave_type_id;


--
-- Name: onhold_payroll; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.onhold_payroll (
    onhold_id integer NOT NULL,
    employee_id integer NOT NULL,
    employee_code character varying(255) NOT NULL,
    employee_name character varying(255) NOT NULL,
    department character varying(255) NOT NULL,
    hold_start_date date NOT NULL,
    hold_reason text,
    status character varying(255) DEFAULT 'active'::character varying,
    total_held_amount numeric DEFAULT 0,
    total_released_amount numeric DEFAULT 0,
    remaining_amount numeric DEFAULT 0,
    months_on_hold integer DEFAULT 0,
    created_by character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.onhold_payroll OWNER TO postgres;

--
-- Name: onhold_payroll_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.onhold_payroll_details (
    detail_id integer NOT NULL,
    onhold_id integer NOT NULL,
    employee_id integer NOT NULL,
    month character varying(255) NOT NULL,
    basic_salary numeric DEFAULT 0,
    allowances_total numeric DEFAULT 0,
    overtime_pay numeric DEFAULT 0,
    gross_pay numeric DEFAULT 0,
    absent_penalty numeric DEFAULT 0,
    late_penalty numeric DEFAULT 0,
    other_penalties numeric DEFAULT 0,
    tax numeric DEFAULT 0,
    pension_7 numeric DEFAULT 0,
    pension_11 numeric DEFAULT 0,
    total_deductions numeric DEFAULT 0,
    net_held_amount numeric DEFAULT 0,
    released_amount numeric DEFAULT 0,
    remaining_amount numeric DEFAULT 0,
    status character varying(255) DEFAULT 'held'::character varying,
    payment_history_id integer,
    released_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.onhold_payroll_details OWNER TO postgres;

--
-- Name: onhold_payroll_details_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.onhold_payroll_details_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.onhold_payroll_details_detail_id_seq OWNER TO postgres;

--
-- Name: onhold_payroll_details_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.onhold_payroll_details_detail_id_seq OWNED BY public.onhold_payroll_details.detail_id;


--
-- Name: onhold_payroll_onhold_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.onhold_payroll_onhold_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.onhold_payroll_onhold_id_seq OWNER TO postgres;

--
-- Name: onhold_payroll_onhold_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.onhold_payroll_onhold_id_seq OWNED BY public.onhold_payroll.onhold_id;


--
-- Name: payment_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_sessions (
    session_id integer NOT NULL,
    period_id integer NOT NULL,
    session_code character varying(255) NOT NULL,
    payment_date date NOT NULL,
    payment_window_days integer DEFAULT 7,
    unclaimed_window_days integer DEFAULT 14,
    total_amount numeric DEFAULT 0,
    employee_count integer DEFAULT 0,
    status public.enum_payment_sessions_status DEFAULT 'active'::public.enum_payment_sessions_status,
    created_by integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.payment_sessions OWNER TO postgres;

--
-- Name: payment_sessions_session_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_sessions_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_sessions_session_id_seq OWNER TO postgres;

--
-- Name: payment_sessions_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_sessions_session_id_seq OWNED BY public.payment_sessions.session_id;


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_transactions (
    transaction_id integer NOT NULL,
    session_id integer,
    payroll_item_id integer NOT NULL,
    employee_id integer NOT NULL,
    period_id integer NOT NULL,
    amount numeric NOT NULL,
    payment_method character varying(255),
    transaction_reference character varying(255),
    payment_date timestamp with time zone,
    status public.enum_payment_transactions_status DEFAULT 'pending'::public.enum_payment_transactions_status,
    processed_by integer,
    processed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.payment_transactions OWNER TO postgres;

--
-- Name: payment_transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_transactions_transaction_id_seq OWNER TO postgres;

--
-- Name: payment_transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_transactions_transaction_id_seq OWNED BY public.payment_transactions.transaction_id;


--
-- Name: payroll_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_history (
    history_id integer NOT NULL,
    payroll_processing_id integer NOT NULL,
    employee_id integer NOT NULL,
    employee_code character varying(255) NOT NULL,
    employee_name character varying(255) NOT NULL,
    department character varying(255) NOT NULL,
    amount numeric NOT NULL,
    payment_date date NOT NULL,
    month character varying(255) NOT NULL,
    method character varying(255) DEFAULT 'Bank Transfer'::character varying,
    transaction_id character varying(255),
    processed_by character varying(255),
    status character varying(255) DEFAULT 'completed'::character varying,
    source character varying(255) DEFAULT 'normal'::character varying,
    notes text,
    created_at timestamp with time zone
);


ALTER TABLE public.payroll_history OWNER TO postgres;

--
-- Name: payroll_history_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_history_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_history_history_id_seq OWNER TO postgres;

--
-- Name: payroll_history_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_history_history_id_seq OWNED BY public.payroll_history.history_id;


--
-- Name: payroll_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_items (
    payroll_item_id integer NOT NULL,
    period_id integer NOT NULL,
    employee_id integer NOT NULL,
    basic_salary numeric NOT NULL,
    housing_allowance numeric DEFAULT 0,
    position_allowance numeric DEFAULT 0,
    transport_allowance numeric DEFAULT 0,
    total_allowances numeric DEFAULT 0,
    overtime_hours numeric DEFAULT 0,
    overtime_pay numeric DEFAULT 0,
    bonus_amount numeric DEFAULT 0,
    other_income numeric DEFAULT 0,
    gross_pay numeric NOT NULL,
    taxable_income numeric DEFAULT 0,
    tax_amount numeric DEFAULT 0,
    tax_bracket_applied character varying(255),
    pension_employee numeric DEFAULT 0,
    pension_employer numeric DEFAULT 0,
    absent_days numeric DEFAULT 0,
    absent_penalty numeric DEFAULT 0,
    late_minutes integer DEFAULT 0,
    late_penalty numeric DEFAULT 0,
    total_penalties numeric DEFAULT 0,
    loan_deduction numeric DEFAULT 0,
    advance_deduction numeric DEFAULT 0,
    cooperative_deduction numeric DEFAULT 0,
    other_deductions numeric DEFAULT 0,
    total_deductions numeric DEFAULT 0,
    carry_forward_amount numeric DEFAULT 0,
    net_pay numeric NOT NULL,
    is_on_hold boolean DEFAULT false,
    hold_id integer,
    hold_reason text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.payroll_items OWNER TO postgres;

--
-- Name: payroll_items_payroll_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_items_payroll_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_items_payroll_item_id_seq OWNER TO postgres;

--
-- Name: payroll_items_payroll_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_items_payroll_item_id_seq OWNED BY public.payroll_items.payroll_item_id;


--
-- Name: payroll_periods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_periods (
    period_id integer NOT NULL,
    period_code character varying(255) NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    payment_date date,
    status public.enum_payroll_periods_status DEFAULT 'draft'::public.enum_payroll_periods_status,
    processed_by integer,
    processed_at timestamp with time zone,
    total_employees integer DEFAULT 0,
    total_basic_salary numeric DEFAULT 0,
    total_allowances numeric DEFAULT 0,
    total_overtime numeric DEFAULT 0,
    total_gross numeric DEFAULT 0,
    total_tax numeric DEFAULT 0,
    total_pension_employee numeric DEFAULT 0,
    total_pension_employer numeric DEFAULT 0,
    total_penalties numeric DEFAULT 0,
    total_deductions numeric DEFAULT 0,
    total_net numeric DEFAULT 0,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.payroll_periods OWNER TO postgres;

--
-- Name: payroll_periods_period_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_periods_period_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_periods_period_id_seq OWNER TO postgres;

--
-- Name: payroll_periods_period_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_periods_period_id_seq OWNED BY public.payroll_periods.period_id;


--
-- Name: payroll_processing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_processing (
    processing_id integer NOT NULL,
    month_year character varying(255) NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    payment_date date NOT NULL,
    status public.enum_payroll_processing_status DEFAULT 'completed'::public.enum_payroll_processing_status,
    processed_by character varying(255),
    processed_at timestamp with time zone,
    unclaimed_count integer DEFAULT 0,
    paid_count integer DEFAULT 0,
    total_amount numeric DEFAULT 0,
    unclaimed_file_name character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.payroll_processing OWNER TO postgres;

--
-- Name: payroll_processing_processing_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_processing_processing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_processing_processing_id_seq OWNER TO postgres;

--
-- Name: payroll_processing_processing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_processing_processing_id_seq OWNED BY public.payroll_processing.processing_id;


--
-- Name: penalty_deductions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.penalty_deductions (
    deduction_id integer NOT NULL,
    employee_id integer NOT NULL,
    summary_id integer NOT NULL,
    penalty_id integer NOT NULL,
    deduction_date timestamp with time zone NOT NULL,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    deduction_type public.enum_penalty_deductions_deduction_type NOT NULL,
    deduction_amount numeric NOT NULL,
    deduction_percentage numeric,
    previous_amount numeric NOT NULL,
    new_amount numeric NOT NULL,
    previous_percentage numeric,
    new_percentage numeric,
    reason text NOT NULL,
    processed_by character varying(255) NOT NULL,
    approved_by character varying(255),
    is_batch boolean DEFAULT false,
    batch_id character varying(255),
    batch_rule_applied json,
    reference character varying(255),
    notes text,
    created_at timestamp with time zone
);


ALTER TABLE public.penalty_deductions OWNER TO postgres;

--
-- Name: penalty_deductions_deduction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.penalty_deductions_deduction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.penalty_deductions_deduction_id_seq OWNER TO postgres;

--
-- Name: penalty_deductions_deduction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.penalty_deductions_deduction_id_seq OWNED BY public.penalty_deductions.deduction_id;


--
-- Name: penalty_reduction_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.penalty_reduction_rules (
    rule_id integer NOT NULL,
    rule_type public.enum_penalty_reduction_rules_rule_type NOT NULL,
    min_value numeric NOT NULL,
    max_value numeric NOT NULL,
    reduction_value numeric NOT NULL,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.penalty_reduction_rules OWNER TO postgres;

--
-- Name: penalty_reduction_rules_rule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.penalty_reduction_rules_rule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.penalty_reduction_rules_rule_id_seq OWNER TO postgres;

--
-- Name: penalty_reduction_rules_rule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.penalty_reduction_rules_rule_id_seq OWNED BY public.penalty_reduction_rules.rule_id;


--
-- Name: penalty_reductions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.penalty_reductions (
    reduction_id integer NOT NULL,
    penalty_id integer NOT NULL,
    employee_id integer NOT NULL,
    period_id integer NOT NULL,
    amount_reduced numeric DEFAULT 0,
    percent_reduced numeric DEFAULT 0,
    new_penalty_amount numeric,
    new_penalty_percent numeric,
    reason text,
    reduced_by integer,
    reduced_at timestamp with time zone,
    created_at timestamp with time zone
);


ALTER TABLE public.penalty_reductions OWNER TO postgres;

--
-- Name: penalty_reductions_reduction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.penalty_reductions_reduction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.penalty_reductions_reduction_id_seq OWNER TO postgres;

--
-- Name: penalty_reductions_reduction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.penalty_reductions_reduction_id_seq OWNED BY public.penalty_reductions.reduction_id;


--
-- Name: penalty_summaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.penalty_summaries (
    summary_id integer NOT NULL,
    employee_id integer NOT NULL,
    penalty_id integer,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    period_label character varying(255) NOT NULL,
    penalty_type public.enum_penalty_summaries_penalty_type NOT NULL,
    penalty_name character varying(255) NOT NULL,
    penalty_category character varying(255),
    original_amount numeric DEFAULT 0 NOT NULL,
    deducted_amount numeric DEFAULT 0 NOT NULL,
    current_amount numeric DEFAULT 0 NOT NULL,
    original_percentage numeric DEFAULT 0,
    deducted_percentage numeric DEFAULT 0,
    current_percentage numeric DEFAULT 0,
    status public.enum_penalty_summaries_status DEFAULT 'active'::public.enum_penalty_summaries_status,
    last_reduction_date date,
    last_reduced_by character varying(255),
    last_reduction_reason text,
    reference_document character varying(255),
    submitted_by character varying(255),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.penalty_summaries OWNER TO postgres;

--
-- Name: penalty_summaries_summary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.penalty_summaries_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.penalty_summaries_summary_id_seq OWNER TO postgres;

--
-- Name: penalty_summaries_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.penalty_summaries_summary_id_seq OWNED BY public.penalty_summaries.summary_id;


--
-- Name: positions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.positions (
    position_id integer NOT NULL,
    code character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    department_id integer,
    level character varying(255),
    min_salary numeric,
    max_salary numeric,
    requirements jsonb,
    responsibilities jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.positions OWNER TO postgres;

--
-- Name: positions_position_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.positions_position_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.positions_position_id_seq OWNER TO postgres;

--
-- Name: positions_position_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.positions_position_id_seq OWNED BY public.positions.position_id;


--
-- Name: recurring_deductions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recurring_deductions (
    deduction_id integer NOT NULL,
    employee_id integer NOT NULL,
    deduction_type character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    amount numeric NOT NULL,
    deduction_type_value character varying(255) DEFAULT 'fixed'::character varying,
    percentage_value numeric,
    start_date date NOT NULL,
    end_date date,
    total_months integer,
    remaining_months integer,
    reference_number character varying(255),
    submitted_by character varying(255),
    contact character varying(255),
    reason text,
    date date,
    created_by_name character varying(255),
    last_applied_period_id integer,
    last_applied_at timestamp with time zone,
    status public.enum_recurring_deductions_status DEFAULT 'active'::public.enum_recurring_deductions_status,
    approved_by integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.recurring_deductions OWNER TO postgres;

--
-- Name: recurring_deductions_deduction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recurring_deductions_deduction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recurring_deductions_deduction_id_seq OWNER TO postgres;

--
-- Name: recurring_deductions_deduction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recurring_deductions_deduction_id_seq OWNED BY public.recurring_deductions.deduction_id;


--
-- Name: returned_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.returned_payments (
    return_id integer NOT NULL,
    transaction_id integer NOT NULL,
    employee_id integer NOT NULL,
    return_date date NOT NULL,
    return_reason character varying(255),
    original_amount numeric,
    returned_amount numeric,
    penalty_amount numeric DEFAULT 0,
    status public.enum_returned_payments_status DEFAULT 'pending'::public.enum_returned_payments_status,
    resolved_by integer,
    resolved_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone
);


ALTER TABLE public.returned_payments OWNER TO postgres;

--
-- Name: returned_payments_return_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.returned_payments_return_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.returned_payments_return_id_seq OWNER TO postgres;

--
-- Name: returned_payments_return_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.returned_payments_return_id_seq OWNED BY public.returned_payments.return_id;


--
-- Name: returned_payroll; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.returned_payroll (
    returned_id integer NOT NULL,
    payroll_processing_id integer NOT NULL,
    employee_id integer NOT NULL,
    employee_code character varying(255) NOT NULL,
    employee_name character varying(255) NOT NULL,
    department character varying(255) NOT NULL,
    month character varying(255) NOT NULL,
    original_payment_id integer,
    original_amount numeric NOT NULL,
    return_date date NOT NULL,
    return_reason text,
    return_source character varying(255) DEFAULT 'bulk'::character varying,
    status character varying(255) DEFAULT 'pending'::character varying,
    paid_amount numeric DEFAULT 0,
    remaining_amount numeric DEFAULT 0,
    kept_amount numeric DEFAULT 0,
    payment_history_id integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.returned_payroll OWNER TO postgres;

--
-- Name: returned_payroll_returned_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.returned_payroll_returned_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.returned_payroll_returned_id_seq OWNER TO postgres;

--
-- Name: returned_payroll_returned_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.returned_payroll_returned_id_seq OWNED BY public.returned_payroll.returned_id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_role_id_seq OWNER TO postgres;

--
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- Name: salary_holds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salary_holds (
    hold_id integer NOT NULL,
    employee_id integer NOT NULL,
    period_id integer,
    hold_reason text NOT NULL,
    hold_duration_months integer DEFAULT 1,
    start_date date NOT NULL,
    end_date date,
    original_amount numeric,
    released_amount numeric DEFAULT 0,
    remaining_amount numeric,
    status public.enum_salary_holds_status DEFAULT 'active'::public.enum_salary_holds_status,
    released_by integer,
    released_at timestamp with time zone,
    created_by integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.salary_holds OWNER TO postgres;

--
-- Name: salary_holds_hold_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.salary_holds_hold_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.salary_holds_hold_id_seq OWNER TO postgres;

--
-- Name: salary_holds_hold_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.salary_holds_hold_id_seq OWNED BY public.salary_holds.hold_id;


--
-- Name: store_group_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.store_group_relations (
    id integer NOT NULL,
    store_id integer NOT NULL,
    group_id integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.store_group_relations OWNER TO postgres;

--
-- Name: store_group_relations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.store_group_relations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.store_group_relations_id_seq OWNER TO postgres;

--
-- Name: store_group_relations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.store_group_relations_id_seq OWNED BY public.store_group_relations.id;


--
-- Name: stores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stores (
    id integer NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    location character varying(255),
    status public.enum_stores_status DEFAULT 'Active'::public.enum_stores_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.stores OWNER TO postgres;

--
-- Name: stores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stores_id_seq OWNER TO postgres;

--
-- Name: stores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stores_id_seq OWNED BY public.stores.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    setting_id integer NOT NULL,
    setting_key character varying(255) NOT NULL,
    setting_value jsonb NOT NULL,
    category character varying(255),
    description text,
    data_type public.enum_system_settings_data_type DEFAULT 'json'::public.enum_system_settings_data_type,
    is_editable boolean DEFAULT true,
    is_encrypted boolean DEFAULT false,
    updated_by integer,
    version integer DEFAULT 1,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: system_settings_setting_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_settings_setting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_setting_id_seq OWNER TO postgres;

--
-- Name: system_settings_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_settings_setting_id_seq OWNED BY public.system_settings.setting_id;


--
-- Name: unclaimed_payroll; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unclaimed_payroll (
    unclaimed_id integer NOT NULL,
    payroll_processing_id integer NOT NULL,
    employee_id integer NOT NULL,
    employee_code character varying(255) NOT NULL,
    employee_name character varying(255) NOT NULL,
    department character varying(255) NOT NULL,
    amount numeric NOT NULL,
    due_date date NOT NULL,
    month character varying(255) NOT NULL,
    days_overdue integer DEFAULT 0,
    status character varying(255) DEFAULT 'unclaimed'::character varying,
    notes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.unclaimed_payroll OWNER TO postgres;

--
-- Name: unclaimed_payroll_unclaimed_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unclaimed_payroll_unclaimed_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unclaimed_payroll_unclaimed_id_seq OWNER TO postgres;

--
-- Name: unclaimed_payroll_unclaimed_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unclaimed_payroll_unclaimed_id_seq OWNED BY public.unclaimed_payroll.unclaimed_id;


--
-- Name: unclaimed_salaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unclaimed_salaries (
    unclaimed_id integer NOT NULL,
    transaction_id integer NOT NULL,
    employee_id integer NOT NULL,
    period_id integer NOT NULL,
    amount numeric NOT NULL,
    due_date date NOT NULL,
    days_overdue integer DEFAULT 0,
    status public.enum_unclaimed_salaries_status DEFAULT 'unclaimed'::public.enum_unclaimed_salaries_status,
    claimed_date date,
    claimed_by integer,
    notes text,
    created_at timestamp with time zone
);


ALTER TABLE public.unclaimed_salaries OWNER TO postgres;

--
-- Name: unclaimed_salaries_unclaimed_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unclaimed_salaries_unclaimed_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unclaimed_salaries_unclaimed_id_seq OWNER TO postgres;

--
-- Name: unclaimed_salaries_unclaimed_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unclaimed_salaries_unclaimed_id_seq OWNED BY public.unclaimed_salaries.unclaimed_id;


--
-- Name: uom; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.uom (
    id integer NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status public.enum_uom_status DEFAULT 'Active'::public.enum_uom_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.uom OWNER TO postgres;

--
-- Name: uom_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.uom_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.uom_id_seq OWNER TO postgres;

--
-- Name: uom_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.uom_id_seq OWNED BY public.uom.id;


--
-- Name: user_group_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_group_relations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.user_group_relations OWNER TO postgres;

--
-- Name: user_group_relations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_group_relations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_group_relations_id_seq OWNER TO postgres;

--
-- Name: user_group_relations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_group_relations_id_seq OWNED BY public.user_group_relations.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    role_id integer NOT NULL,
    department_id integer,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    created_by integer,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: attendance_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records ALTER COLUMN id SET DEFAULT nextval('public.attendance_records_id_seq'::regclass);


--
-- Name: carry_forwards carry_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carry_forwards ALTER COLUMN carry_id SET DEFAULT nextval('public.carry_forwards_carry_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: compensation_history history_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compensation_history ALTER COLUMN history_id SET DEFAULT nextval('public.compensation_history_history_id_seq'::regclass);


--
-- Name: deduction_applications application_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deduction_applications ALTER COLUMN application_id SET DEFAULT nextval('public.deduction_applications_application_id_seq'::regclass);


--
-- Name: departments department_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN department_id SET DEFAULT nextval('public.departments_department_id_seq'::regclass);


--
-- Name: employee_documents document_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_documents ALTER COLUMN document_id SET DEFAULT nextval('public.employee_documents_document_id_seq'::regclass);


--
-- Name: employee_penalties penalty_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_penalties ALTER COLUMN penalty_id SET DEFAULT nextval('public.employee_penalties_penalty_id_seq'::regclass);


--
-- Name: employees employee_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN employee_id SET DEFAULT nextval('public.employees_employee_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- Name: hold_releases release_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hold_releases ALTER COLUMN release_id SET DEFAULT nextval('public.hold_releases_release_id_seq'::regclass);


--
-- Name: import_batches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_batches ALTER COLUMN id SET DEFAULT nextval('public.import_batches_id_seq'::regclass);


--
-- Name: import_errors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_errors ALTER COLUMN id SET DEFAULT nextval('public.import_errors_id_seq'::regclass);


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: leave_balances leave_balance_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances ALTER COLUMN leave_balance_id SET DEFAULT nextval('public.leave_balances_leave_balance_id_seq'::regclass);


--
-- Name: leave_extensions extension_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_extensions ALTER COLUMN extension_id SET DEFAULT nextval('public.leave_extensions_extension_id_seq'::regclass);


--
-- Name: leave_notifications notification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.leave_notifications_notification_id_seq'::regclass);


--
-- Name: leave_requests leave_request_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests ALTER COLUMN leave_request_id SET DEFAULT nextval('public.leave_requests_leave_request_id_seq'::regclass);


--
-- Name: leave_types leave_type_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types ALTER COLUMN leave_type_id SET DEFAULT nextval('public.leave_types_leave_type_id_seq'::regclass);


--
-- Name: onhold_payroll onhold_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onhold_payroll ALTER COLUMN onhold_id SET DEFAULT nextval('public.onhold_payroll_onhold_id_seq'::regclass);


--
-- Name: onhold_payroll_details detail_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onhold_payroll_details ALTER COLUMN detail_id SET DEFAULT nextval('public.onhold_payroll_details_detail_id_seq'::regclass);


--
-- Name: payment_sessions session_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_sessions ALTER COLUMN session_id SET DEFAULT nextval('public.payment_sessions_session_id_seq'::regclass);


--
-- Name: payment_transactions transaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.payment_transactions_transaction_id_seq'::regclass);


--
-- Name: payroll_history history_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_history ALTER COLUMN history_id SET DEFAULT nextval('public.payroll_history_history_id_seq'::regclass);


--
-- Name: payroll_items payroll_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_items ALTER COLUMN payroll_item_id SET DEFAULT nextval('public.payroll_items_payroll_item_id_seq'::regclass);


--
-- Name: payroll_periods period_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_periods ALTER COLUMN period_id SET DEFAULT nextval('public.payroll_periods_period_id_seq'::regclass);


--
-- Name: payroll_processing processing_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_processing ALTER COLUMN processing_id SET DEFAULT nextval('public.payroll_processing_processing_id_seq'::regclass);


--
-- Name: penalty_deductions deduction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_deductions ALTER COLUMN deduction_id SET DEFAULT nextval('public.penalty_deductions_deduction_id_seq'::regclass);


--
-- Name: penalty_reduction_rules rule_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_reduction_rules ALTER COLUMN rule_id SET DEFAULT nextval('public.penalty_reduction_rules_rule_id_seq'::regclass);


--
-- Name: penalty_reductions reduction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_reductions ALTER COLUMN reduction_id SET DEFAULT nextval('public.penalty_reductions_reduction_id_seq'::regclass);


--
-- Name: penalty_summaries summary_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_summaries ALTER COLUMN summary_id SET DEFAULT nextval('public.penalty_summaries_summary_id_seq'::regclass);


--
-- Name: positions position_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions ALTER COLUMN position_id SET DEFAULT nextval('public.positions_position_id_seq'::regclass);


--
-- Name: recurring_deductions deduction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_deductions ALTER COLUMN deduction_id SET DEFAULT nextval('public.recurring_deductions_deduction_id_seq'::regclass);


--
-- Name: returned_payments return_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_payments ALTER COLUMN return_id SET DEFAULT nextval('public.returned_payments_return_id_seq'::regclass);


--
-- Name: returned_payroll returned_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_payroll ALTER COLUMN returned_id SET DEFAULT nextval('public.returned_payroll_returned_id_seq'::regclass);


--
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- Name: salary_holds hold_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_holds ALTER COLUMN hold_id SET DEFAULT nextval('public.salary_holds_hold_id_seq'::regclass);


--
-- Name: store_group_relations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_group_relations ALTER COLUMN id SET DEFAULT nextval('public.store_group_relations_id_seq'::regclass);


--
-- Name: stores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stores ALTER COLUMN id SET DEFAULT nextval('public.stores_id_seq'::regclass);


--
-- Name: system_settings setting_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN setting_id SET DEFAULT nextval('public.system_settings_setting_id_seq'::regclass);


--
-- Name: unclaimed_payroll unclaimed_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unclaimed_payroll ALTER COLUMN unclaimed_id SET DEFAULT nextval('public.unclaimed_payroll_unclaimed_id_seq'::regclass);


--
-- Name: unclaimed_salaries unclaimed_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unclaimed_salaries ALTER COLUMN unclaimed_id SET DEFAULT nextval('public.unclaimed_salaries_unclaimed_id_seq'::regclass);


--
-- Name: uom id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uom ALTER COLUMN id SET DEFAULT nextval('public.uom_id_seq'::regclass);


--
-- Name: user_group_relations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_group_relations ALTER COLUMN id SET DEFAULT nextval('public.user_group_relations_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: SequelizeMeta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SequelizeMeta" (name) FROM stdin;
20260625044835-initial-migration.js
\.


--
-- Data for Name: attendance_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_records (id, import_batch_id, employee_id, late_minutes, half_day_absence, early_leave_days, imported_dates, absence_days, normal_ot_minutes, weekend_ot_minutes, holiday_ot_minutes, period_start_date, period_end_date, period_days, raw_data, is_valid, validation_errors, created_at, period_year, period_month, updated_at) FROM stdin;
\.


--
-- Data for Name: carry_forwards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carry_forwards (carry_id, employee_id, period_id, amount, status, cleared_in_period_id, cleared_at, notes, created_at) FROM stdin;
1	8	1	1500	pending	\N	\N	Carry forward from previous month due to negative net pay	2026-06-25 08:07:14.526+03
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, description, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: compensation_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compensation_history (history_id, employee_id, component_type, old_value, new_value, change_percent, effective_date, reason, approved_by, created_at) FROM stdin;
\.


--
-- Data for Name: deduction_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deduction_applications (application_id, deduction_id, period_id, employee_id, amount_applied, submitted_by, submitted_by_name, contact, reason, notes, application_date, status, approval_reference, is_partial, original_amount, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (department_id, code, name, description, manager_id, parent_department_id, budget, location, is_active, created_at, updated_at) FROM stdin;
1	IT	Information Technology	Software development, infrastructure, and IT support	\N	\N	5000000	5th Floor, Main Building	t	2026-06-25 08:07:14.488+03	2026-06-25 08:07:14.488+03
2	FIN	Finance	Financial management, accounting, and treasury	\N	\N	3000000	3rd Floor, Main Building	t	2026-06-25 08:07:14.488+03	2026-06-25 08:07:14.488+03
3	OPS	Operations	Daily operations and logistics	\N	\N	4000000	2nd Floor, Main Building	t	2026-06-25 08:07:14.488+03	2026-06-25 08:07:14.488+03
4	HR	Human Resources	Recruitment, payroll, and employee relations	\N	\N	2000000	4th Floor, Main Building	t	2026-06-25 08:07:14.488+03	2026-06-25 08:07:14.488+03
5	MKT	Marketing	Marketing, branding, and communications	\N	\N	2500000	6th Floor, Main Building	t	2026-06-25 08:07:14.488+03	2026-06-25 08:07:14.488+03
\.


--
-- Data for Name: employee_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_documents (document_id, employee_id, document_type, document_name, file_url, file_size, mime_type, uploaded_by, expiry_date, status, notes, is_active, sub_type, index, description, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_penalties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_penalties (penalty_id, employee_id, period_id, penalty_type, calculation_type, value, calculated_amount, reference, submitted_by, contact, reason, month, status, original_value, reduction_reason, reduced_by, reduced_at, created_by, created_at, updated_at, penalty_date, period_start_date, period_end_date, period_label, reduced_amount) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (employee_id, employee_code, user_id, first_name, last_name, middle_name, full_name_english, date_of_birth_ec, date_of_birth_gc, gender, marital_status, nationality, national_id, national_id_document, work_email, personal_email, phone_number, current_address, permanent_address, birth_place, work_location, current_company, department_id, position_id, manager_id, employment_type, employment_status, hire_date_ec, hire_date_gc, confirmation_date_ec, confirmation_date_gc, termination_date_ec, termination_date_gc, shift_type, basic_salary, housing_allowance, position_allowance, transport_allowance, mobile_allowance, bank_account, emergency_contact, emergency_contact_address, mothers_full_name, spouse_info, children, parents_info, parent_support, education, training, work_experience, language_skills, other_skills, nationality_acquisition, health_info, legal_info, guarantee_info, profile_picture, profile_picture_url, profile_picture_public_id, is_active, created_at, updated_at) FROM stdin;
1	EMP001	5	Biruk	Mulualem	\N	\N	\N	1990-05-15	male	married	Ethiopian	\N	\N	biruk.mulualem@superhr.com	biruk.mulualem@email.com	0911000001	{"city": "Addis Ababa", "woreda": "03", "subcity": "Bole"}	{"city": "Addis Ababa", "woreda": "03", "subcity": "Bole"}	\N	Main Office	\N	1	1	\N	full-time	active	\N	2018-01-15	\N	2018-07-15	\N	\N	day	50000	10000	7500	5000	0	{"bank": "Commercial Bank of Ethiopia", "account": "1000001"}	{"name": "Wife", "phone": "0911000010"}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-25 08:07:14.5+03	2026-06-25 08:07:14.5+03
2	EMP002	6	Dagmawi	Hadgu	\N	\N	\N	1988-03-20	male	married	Ethiopian	\N	\N	dagmawi.hadgu@superhr.com	dagmawi.hadgu@email.com	0911000002	{"city": "Addis Ababa", "woreda": "05", "subcity": "Kirkos"}	{"city": "Addis Ababa", "woreda": "05", "subcity": "Kirkos"}	\N	Main Office	\N	1	2	1	full-time	active	\N	2019-06-01	\N	2019-12-01	\N	\N	day	35000	7000	5250	3500	0	{"bank": "Awash Bank", "account": "2000001"}	{"name": "Spouse", "phone": "0911000011"}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-25 08:07:14.5+03	2026-06-25 08:07:14.5+03
3	EMP003	8	Melkamu	Zewdu	\N	\N	\N	1992-11-10	male	single	Ethiopian	\N	\N	melkamu.zewdu@superhr.com	melkamu.zewdu@email.com	0911000003	{"city": "Addis Ababa", "woreda": "07", "subcity": "Gullele"}	{"city": "Addis Ababa", "woreda": "07", "subcity": "Gullele"}	\N	Main Office	\N	3	8	\N	full-time	active	\N	2020-02-10	\N	2020-08-10	\N	\N	day	28000	5600	4200	2800	0	{"bank": "Dashen Bank", "account": "3000001"}	{"name": "Sister", "phone": "0911000012"}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-25 08:07:14.5+03	2026-06-25 08:07:14.5+03
4	EMP004	9	Melaku	Tewodros	\N	\N	\N	1985-08-25	male	married	Ethiopian	\N	\N	melaku.tewodros@superhr.com	melaku.tewodros@email.com	0911000004	{"city": "Addis Ababa", "woreda": "12", "subcity": "Yeka"}	{"city": "Addis Ababa", "woreda": "12", "subcity": "Yeka"}	\N	Main Office	\N	2	6	\N	full-time	active	\N	2017-04-20	\N	2017-10-20	\N	\N	day	32000	6400	4800	3200	0	{"bank": "Commercial Bank of Ethiopia", "account": "4000001"}	{"name": "Wife", "phone": "0911000013"}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-25 08:07:14.5+03	2026-06-25 08:07:14.5+03
5	EMP005	10	Tamrat	Zerihun	\N	\N	\N	1995-12-05	male	single	Ethiopian	\N	\N	tamrat.zerihun@superhr.com	tamrat.zerihun@email.com	0911000005	{"city": "Addis Ababa", "woreda": "09", "subcity": "Kolfe"}	{"city": "Addis Ababa", "woreda": "09", "subcity": "Kolfe"}	\N	Main Office	\N	1	4	2	full-time	active	\N	2021-09-01	\N	2022-03-01	\N	\N	day	18000	3600	2700	1800	0	{"bank": "Awash Bank", "account": "5000001"}	{"name": "Brother", "phone": "0911000014"}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-25 08:07:14.5+03	2026-06-25 08:07:14.5+03
6	EMP006	11	Nuru	Seid	\N	\N	\N	1993-06-18	female	married	Ethiopian	\N	\N	nuru.seid@superhr.com	nuru.seid@email.com	0911000006	{"city": "Addis Ababa", "woreda": "15", "subcity": "Nifas Silk"}	{"city": "Addis Ababa", "woreda": "15", "subcity": "Nifas Silk"}	\N	Main Office	\N	2	7	4	full-time	active	\N	2020-11-15	\N	2021-05-15	\N	\N	day	15000	3000	2250	1500	0	{"bank": "Dashen Bank", "account": "6000001"}	{"name": "Husband", "phone": "0911000015"}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-25 08:07:14.5+03	2026-06-25 08:07:14.5+03
7	EMP007	12	Tadese	Jemberu	\N	\N	\N	1994-09-22	male	single	Ethiopian	\N	\N	tadese.jemberu@superhr.com	tadese.jemberu@email.com	0911000007	{"city": "Addis Ababa", "woreda": "08", "subcity": "Addis Ketema"}	{"city": "Addis Ababa", "woreda": "08", "subcity": "Addis Ketema"}	\N	Main Office	\N	3	9	3	full-time	active	\N	2022-01-10	\N	2022-07-10	\N	\N	day	12000	2400	1800	1200	0	{"bank": "Commercial Bank of Ethiopia", "account": "7000001"}	{"name": "Mother", "phone": "0911000016"}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-25 08:07:14.5+03	2026-06-25 08:07:14.5+03
8	EMP008	13	Eshete	Worke	\N	\N	\N	1991-07-30	male	married	Ethiopian	\N	\N	eshete.worke@superhr.com	eshete.worke@email.com	0911000008	{"city": "Addis Ababa", "woreda": "04", "subcity": "Bole"}	{"city": "Addis Ababa", "woreda": "04", "subcity": "Bole"}	\N	Main Office	\N	1	3	2	full-time	active	\N	2019-03-20	\N	2019-09-20	\N	\N	night	22000	4400	3300	2200	0	{"bank": "Awash Bank", "account": "8000001"}	{"name": "Wife", "phone": "0911000017"}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-25 08:07:14.5+03	2026-06-25 08:07:14.5+03
9	EMP009	7	Haymanot	Abebaw	\N	\N	\N	1987-02-14	female	married	Ethiopian	\N	\N	haymanot.abebaw@superhr.com	haymanot.abebaw@email.com	0911000009	{"city": "Addis Ababa", "woreda": "02", "subcity": "Kirkos"}	{"city": "Addis Ababa", "woreda": "02", "subcity": "Kirkos"}	\N	Main Office	\N	4	10	\N	full-time	active	\N	2016-08-01	\N	2017-02-01	\N	\N	day	30000	6000	4500	3000	0	{"bank": "Dashen Bank", "account": "9000001"}	{"name": "Husband", "phone": "0911000018"}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-25 08:07:14.5+03	2026-06-25 08:07:14.5+03
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups (id, code, name, description, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: hold_releases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hold_releases (release_id, hold_id, release_type, release_percent, release_amount, release_reason, released_by, released_at, applied_to_period_id, created_at) FROM stdin;
\.


--
-- Data for Name: import_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.import_batches (id, file_name, file_path, import_date, period_start, period_end, period_type, total_rows, success_rows, error_rows, status, imported_by, notes, started_at, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: import_errors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.import_errors (id, import_batch_id, row_number, employee_id, error_type, error_message, raw_data, is_resolved, created_at, resolved_at, resolution_notes) FROM stdin;
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (id, code, name, standard_name, description, brand, model, barcode, category_id, uom_id, conversion_uom_id, conversion_value, cost_price, status, spec_type, spec_text, spec_pdf_name, spec_pdf_size, spec_pdf_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: leave_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_balances (leave_balance_id, employee_id, year, years_of_service, yearly_entitlement, carried_over, carried_over_from_year, carried_over_expiry_date, total_allocation, used_this_year, pending_days, available_days, sick_used_this_year, sick_alert_sent, maternity_used, maternity_used_date, paternity_used, paternity_used_date, bereavement_used_this_year, unpaid_used_this_year, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: leave_extensions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_extensions (extension_id, leave_request_id, requested_date, original_end_date, additional_days, requested_new_end_date, reason, status, approved_by, approved_date, rejection_reason, rejected_by, rejected_date, new_end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: leave_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_notifications (notification_id, employee_id, leave_request_id, notification_type, channel, subject, message, sent_date, read_at, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_requests (leave_request_id, employee_id, department_id, leave_type_id, leave_type_name, start_date, end_date, return_date, total_days, reason, status, requested_date, approved_by, approved_date, approval_notes, rejection_reason, rejected_by, rejected_date, hr_notes, return_status, actual_return_date, days_late, return_confirmed_by, return_confirmed_date, extension_count, total_extension_days, last_extended_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: leave_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_types (leave_type_id, name, code, description, default_days, is_paid, has_fixed_limit, is_one_time, requires_approval, min_notice_days, max_consecutive_days, requires_documentation, gender_restriction, carry_over_limit, carry_over_expiry_years, is_active, sort_order, created_at, updated_at) FROM stdin;
1	Annual Leave	AL	Regular annual vacation leave	16	t	t	f	t	7	30	f	none	10	2	t	1	2026-06-25 08:07:14.517+03	2026-06-25 08:07:14.517+03
2	Sick Leave	SL	Medical leave with doctor's note	\N	t	f	f	f	0	30	t	none	0	0	t	2	2026-06-25 08:07:14.517+03	2026-06-25 08:07:14.517+03
3	Maternity Leave	ML	Maternity leave for female employees	90	t	t	t	t	30	90	t	female	0	0	t	3	2026-06-25 08:07:14.517+03	2026-06-25 08:07:14.517+03
4	Paternity Leave	PL	Paternity leave for male employees	3	t	t	t	t	14	3	f	male	0	0	t	4	2026-06-25 08:07:14.517+03	2026-06-25 08:07:14.517+03
5	Bereavement Leave	BL	Leave for family bereavement	3	t	t	f	t	0	5	t	none	0	0	t	5	2026-06-25 08:07:14.517+03	2026-06-25 08:07:14.517+03
6	Unpaid Leave	UL	Unpaid leave for personal reasons	\N	f	f	f	t	14	30	f	none	0	0	t	6	2026-06-25 08:07:14.517+03	2026-06-25 08:07:14.517+03
\.


--
-- Data for Name: onhold_payroll; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.onhold_payroll (onhold_id, employee_id, employee_code, employee_name, department, hold_start_date, hold_reason, status, total_held_amount, total_released_amount, remaining_amount, months_on_hold, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: onhold_payroll_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.onhold_payroll_details (detail_id, onhold_id, employee_id, month, basic_salary, allowances_total, overtime_pay, gross_pay, absent_penalty, late_penalty, other_penalties, tax, pension_7, pension_11, total_deductions, net_held_amount, released_amount, remaining_amount, status, payment_history_id, released_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payment_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_sessions (session_id, period_id, session_code, payment_date, payment_window_days, unclaimed_window_days, total_amount, employee_count, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payment_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_transactions (transaction_id, session_id, payroll_item_id, employee_id, period_id, amount, payment_method, transaction_reference, payment_date, status, processed_by, processed_at, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payroll_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payroll_history (history_id, payroll_processing_id, employee_id, employee_code, employee_name, department, amount, payment_date, month, method, transaction_id, processed_by, status, source, notes, created_at) FROM stdin;
\.


--
-- Data for Name: payroll_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payroll_items (payroll_item_id, period_id, employee_id, basic_salary, housing_allowance, position_allowance, transport_allowance, total_allowances, overtime_hours, overtime_pay, bonus_amount, other_income, gross_pay, taxable_income, tax_amount, tax_bracket_applied, pension_employee, pension_employer, absent_days, absent_penalty, late_minutes, late_penalty, total_penalties, loan_deduction, advance_deduction, cooperative_deduction, other_deductions, total_deductions, carry_forward_amount, net_pay, is_on_hold, hold_id, hold_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payroll_periods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payroll_periods (period_id, period_code, year, month, start_date, end_date, payment_date, status, processed_by, processed_at, total_employees, total_basic_salary, total_allowances, total_overtime, total_gross, total_tax, total_pension_employee, total_pension_employer, total_penalties, total_deductions, total_net, created_at, updated_at) FROM stdin;
1	202606	2026	6	2026-05-31	2026-06-29	2026-07-09	draft	2	\N	9	0	0	0	0	0	0	0	0	0	0	2026-06-25 08:07:14.52+03	2026-06-25 08:07:14.52+03
\.


--
-- Data for Name: payroll_processing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payroll_processing (processing_id, month_year, year, month, payment_date, status, processed_by, processed_at, unclaimed_count, paid_count, total_amount, unclaimed_file_name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: penalty_deductions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.penalty_deductions (deduction_id, employee_id, summary_id, penalty_id, deduction_date, period_start_date, period_end_date, deduction_type, deduction_amount, deduction_percentage, previous_amount, new_amount, previous_percentage, new_percentage, reason, processed_by, approved_by, is_batch, batch_id, batch_rule_applied, reference, notes, created_at) FROM stdin;
\.


--
-- Data for Name: penalty_reduction_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.penalty_reduction_rules (rule_id, rule_type, min_value, max_value, reduction_value, is_active, created_by, created_at, updated_at) FROM stdin;
1	amount	0	1000	0	t	1	2026-06-25 08:07:14.528+03	2026-06-25 08:07:14.528+03
2	amount	1000	5000	500	t	1	2026-06-25 08:07:14.528+03	2026-06-25 08:07:14.528+03
3	amount	5000	999999	1000	t	1	2026-06-25 08:07:14.528+03	2026-06-25 08:07:14.528+03
4	percent	0	5	0	t	1	2026-06-25 08:07:14.528+03	2026-06-25 08:07:14.528+03
5	percent	5	10	2	t	1	2026-06-25 08:07:14.528+03	2026-06-25 08:07:14.528+03
6	percent	10	999999	5	t	1	2026-06-25 08:07:14.528+03	2026-06-25 08:07:14.528+03
\.


--
-- Data for Name: penalty_reductions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.penalty_reductions (reduction_id, penalty_id, employee_id, period_id, amount_reduced, percent_reduced, new_penalty_amount, new_penalty_percent, reason, reduced_by, reduced_at, created_at) FROM stdin;
\.


--
-- Data for Name: penalty_summaries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.penalty_summaries (summary_id, employee_id, penalty_id, period_start_date, period_end_date, period_label, penalty_type, penalty_name, penalty_category, original_amount, deducted_amount, current_amount, original_percentage, deducted_percentage, current_percentage, status, last_reduction_date, last_reduced_by, last_reduction_reason, reference_document, submitted_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.positions (position_id, code, title, department_id, level, min_salary, max_salary, requirements, responsibilities, is_active, created_at, updated_at) FROM stdin;
1	CTO	Chief Technology Officer	1	Executive	50000	80000	["Master's degree", "10+ years experience"]	["Technology strategy", "Team leadership"]	t	2026-06-25 08:07:14.493+03	2026-06-25 08:07:14.493+03
2	TL	Team Lead	1	Senior	35000	55000	["Bachelor's degree", "5+ years experience"]	["Team management", "Code review"]	t	2026-06-25 08:07:14.493+03	2026-06-25 08:07:14.493+03
3	SD	Senior Developer	1	Senior	30000	45000	["Bachelor's degree", "5+ years experience"]	["Development", "Mentoring"]	t	2026-06-25 08:07:14.493+03	2026-06-25 08:07:14.493+03
4	DEV	Developer	1	Mid	18000	30000	["Bachelor's degree", "2+ years experience"]	["Development", "Testing"]	t	2026-06-25 08:07:14.493+03	2026-06-25 08:07:14.493+03
5	JDEV	Junior Developer	1	Junior	10000	18000	["Bachelor's degree", "Entry level"]	["Development", "Learning"]	t	2026-06-25 08:07:14.493+03	2026-06-25 08:07:14.493+03
6	FM	Finance Manager	2	Senior	35000	55000	["Accounting degree", "CPA preferred"]	["Financial planning", "Reporting"]	t	2026-06-25 08:07:14.493+03	2026-06-25 08:07:14.493+03
7	ACC	Accountant	2	Mid	15000	25000	["Accounting degree"]	["Bookkeeping", "Reconciliation"]	t	2026-06-25 08:07:14.493+03	2026-06-25 08:07:14.493+03
8	OM	Operations Manager	3	Senior	30000	50000	["Bachelor's degree", "5+ years experience"]	["Operations oversight", "Process improvement"]	t	2026-06-25 08:07:14.493+03	2026-06-25 08:07:14.493+03
9	CORD	Coordinator	3	Mid	12000	20000	["Bachelor's degree", "2+ years experience"]	["Coordination", "Logistics"]	t	2026-06-25 08:07:14.493+03	2026-06-25 08:07:14.493+03
10	HRM	HR Manager	4	Senior	30000	50000	["HR degree", "5+ years experience"]	["HR strategy", "Employee relations"]	t	2026-06-25 08:07:14.493+03	2026-06-25 08:07:14.493+03
11	HRG	HR Generalist	4	Mid	12000	20000	["HR degree", "2+ years experience"]	["Recruitment", "Payroll support"]	t	2026-06-25 08:07:14.493+03	2026-06-25 08:07:14.493+03
12	MM	Marketing Manager	5	Senior	28000	45000	["Marketing degree", "5+ years experience"]	["Marketing strategy", "Campaigns"]	t	2026-06-25 08:07:14.493+03	2026-06-25 08:07:14.493+03
\.


--
-- Data for Name: recurring_deductions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recurring_deductions (deduction_id, employee_id, deduction_type, name, amount, deduction_type_value, percentage_value, start_date, end_date, total_months, remaining_months, reference_number, submitted_by, contact, reason, date, created_by_name, last_applied_period_id, last_applied_at, status, approved_by, created_at, updated_at) FROM stdin;
1	5	Loan	Housing Loan	2000	fixed	\N	2026-03-31	2027-03-31	12	9	LOAN-001	HR Manager	\N	\N	\N	\N	\N	\N	active	2	2026-06-25 08:07:14.524+03	2026-06-25 08:07:14.524+03
2	6	Cooperative	Cooperative Contribution	5	percent	5	2025-12-31	\N	24	18	COOP-001	Finance Officer	\N	\N	\N	\N	\N	\N	active	3	2026-06-25 08:07:14.524+03	2026-06-25 08:07:14.524+03
\.


--
-- Data for Name: returned_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.returned_payments (return_id, transaction_id, employee_id, return_date, return_reason, original_amount, returned_amount, penalty_amount, status, resolved_by, resolved_at, notes, created_at) FROM stdin;
\.


--
-- Data for Name: returned_payroll; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.returned_payroll (returned_id, payroll_processing_id, employee_id, employee_code, employee_name, department, month, original_payment_id, original_amount, return_date, return_reason, return_source, status, paid_amount, remaining_amount, kept_amount, payment_history_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, name, description, is_active, created_at, updated_at) FROM stdin;
1	admin	System Administrator - Full access	t	2026-06-25 08:07:14.496+03	2026-06-25 08:07:14.496+03
2	hr	HR Manager - Payroll and employee management	t	2026-06-25 08:07:14.496+03	2026-06-25 08:07:14.496+03
3	finance	Finance - Payment processing and reports	t	2026-06-25 08:07:14.496+03	2026-06-25 08:07:14.496+03
4	attendance	Attendance - Track attendance and penalties	t	2026-06-25 08:07:14.496+03	2026-06-25 08:07:14.496+03
5	employee	Regular employee - View own data only	t	2026-06-25 08:07:14.496+03	2026-06-25 08:07:14.496+03
\.


--
-- Data for Name: salary_holds; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.salary_holds (hold_id, employee_id, period_id, hold_reason, hold_duration_months, start_date, end_date, original_amount, released_amount, remaining_amount, status, released_by, released_at, created_by, created_at, updated_at) FROM stdin;
1	3	1	Pending disciplinary investigation	2	2026-05-14	2026-07-14	28000	0	28000	active	\N	\N	2	2026-06-25 08:07:14.522+03	2026-06-25 08:07:14.522+03
2	7	1	Salary dispute under review	1	2026-05-31	2026-06-30	12000	0	12000	active	\N	\N	2	2026-06-25 08:07:14.522+03	2026-06-25 08:07:14.522+03
\.


--
-- Data for Name: store_group_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.store_group_relations (id, store_id, group_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: stores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stores (id, code, name, location, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (setting_id, setting_key, setting_value, category, description, data_type, is_editable, is_encrypted, updated_by, version, created_at, updated_at) FROM stdin;
1	company.name	"SuperHR Solutions"	company	Company name	string	t	f	1	1	2026-06-25 08:07:14.53+03	2026-06-25 08:07:14.53+03
2	payroll.working_days	22	payroll	Number of working days per month	number	t	f	1	1	2026-06-25 08:07:14.53+03	2026-06-25 08:07:14.53+03
3	payroll.allowance_rate	0.45	payroll	Total allowance rate (45% of basic salary)	number	t	f	1	1	2026-06-25 08:07:14.53+03	2026-06-25 08:07:14.53+03
4	payroll.pension.employee_rate	7	payroll	Employee pension contribution rate (7%)	number	t	f	1	1	2026-06-25 08:07:14.53+03	2026-06-25 08:07:14.53+03
5	payroll.pension.employer_rate	11	payroll	Employer pension contribution rate (11%)	number	t	f	1	1	2026-06-25 08:07:14.53+03	2026-06-25 08:07:14.53+03
6	payroll.pension.monthly_cap	15000	payroll	Monthly salary cap for pension calculation	number	t	f	1	1	2026-06-25 08:07:14.53+03	2026-06-25 08:07:14.53+03
7	tax.brackets	{"brackets": [{"max": 600, "min": 0, "rate": 0}, {"max": 1650, "min": 601, "rate": 10}, {"max": 3200, "min": 1651, "rate": 15}, {"max": 5250, "min": 3201, "rate": 20}, {"max": 7800, "min": 5251, "rate": 25}, {"max": 10900, "min": 7801, "rate": 30}, {"max": null, "min": 10901, "rate": 35}]}	tax	Ethiopian employment tax brackets	json	t	f	1	1	2026-06-25 08:07:14.53+03	2026-06-25 08:07:14.53+03
\.


--
-- Data for Name: unclaimed_payroll; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unclaimed_payroll (unclaimed_id, payroll_processing_id, employee_id, employee_code, employee_name, department, amount, due_date, month, days_overdue, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: unclaimed_salaries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unclaimed_salaries (unclaimed_id, transaction_id, employee_id, period_id, amount, due_date, days_overdue, status, claimed_date, claimed_by, notes, created_at) FROM stdin;
\.


--
-- Data for Name: uom; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.uom (id, code, name, description, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_group_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_group_relations (id, user_id, group_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, email, password_hash, full_name, role_id, department_id, is_active, last_login, created_by, created_at, updated_at) FROM stdin;
2	hrmanager	hr@superhr.com	$2b$10$98ND5B/wE7QS2mcVzu06TOZNYIDWhTb5as0mwCoRSNgtPqaZlE5Fy	HR Manager	2	4	t	\N	\N	2026-06-25 08:07:14.498+03	2026-06-25 08:07:14.498+03
3	finance	finance@superhr.com	$2b$10$98ND5B/wE7QS2mcVzu06TOZNYIDWhTb5as0mwCoRSNgtPqaZlE5Fy	Finance Officer	3	2	t	\N	\N	2026-06-25 08:07:14.498+03	2026-06-25 08:07:14.498+03
4	attendance	attendance@superhr.com	$2b$10$98ND5B/wE7QS2mcVzu06TOZNYIDWhTb5as0mwCoRSNgtPqaZlE5Fy	Attendance Officer	4	3	t	\N	\N	2026-06-25 08:07:14.498+03	2026-06-25 08:07:14.498+03
5	biruk	biruk@superhr.com	$2b$10$98ND5B/wE7QS2mcVzu06TOZNYIDWhTb5as0mwCoRSNgtPqaZlE5Fy	Biruk Mulualem	5	1	t	\N	\N	2026-06-25 08:07:14.498+03	2026-06-25 08:07:14.498+03
6	dagmawi	dagmawi@superhr.com	$2b$10$98ND5B/wE7QS2mcVzu06TOZNYIDWhTb5as0mwCoRSNgtPqaZlE5Fy	Dagmawi Hadgu	5	1	t	\N	\N	2026-06-25 08:07:14.498+03	2026-06-25 08:07:14.498+03
7	haymanot	haymanot@superhr.com	$2b$10$98ND5B/wE7QS2mcVzu06TOZNYIDWhTb5as0mwCoRSNgtPqaZlE5Fy	Haymanot Abebaw	5	4	t	\N	\N	2026-06-25 08:07:14.498+03	2026-06-25 08:07:14.498+03
8	melkamu	melkamu@superhr.com	$2b$10$98ND5B/wE7QS2mcVzu06TOZNYIDWhTb5as0mwCoRSNgtPqaZlE5Fy	Melkamu Zewdu	5	3	t	\N	\N	2026-06-25 08:07:14.498+03	2026-06-25 08:07:14.498+03
9	melaku	melaku@superhr.com	$2b$10$98ND5B/wE7QS2mcVzu06TOZNYIDWhTb5as0mwCoRSNgtPqaZlE5Fy	Melaku Tewodros	5	2	t	\N	\N	2026-06-25 08:07:14.498+03	2026-06-25 08:07:14.498+03
10	tamrat	tamrat@superhr.com	$2b$10$98ND5B/wE7QS2mcVzu06TOZNYIDWhTb5as0mwCoRSNgtPqaZlE5Fy	Tamrat Zerihun	5	1	t	\N	\N	2026-06-25 08:07:14.498+03	2026-06-25 08:07:14.498+03
11	nuru	nuru@superhr.com	$2b$10$98ND5B/wE7QS2mcVzu06TOZNYIDWhTb5as0mwCoRSNgtPqaZlE5Fy	Nuru Seid	5	2	t	\N	\N	2026-06-25 08:07:14.498+03	2026-06-25 08:07:14.498+03
12	tadese	tadese@superhr.com	$2b$10$98ND5B/wE7QS2mcVzu06TOZNYIDWhTb5as0mwCoRSNgtPqaZlE5Fy	Tadese Jemberu	5	3	t	\N	\N	2026-06-25 08:07:14.498+03	2026-06-25 08:07:14.498+03
13	eshete	eshete@superhr.com	$2b$10$98ND5B/wE7QS2mcVzu06TOZNYIDWhTb5as0mwCoRSNgtPqaZlE5Fy	Eshete Worke	5	1	t	\N	\N	2026-06-25 08:07:14.498+03	2026-06-25 08:07:14.498+03
1	admin	admin@superhr.com	$2b$10$98ND5B/wE7QS2mcVzu06TOZNYIDWhTb5as0mwCoRSNgtPqaZlE5Fy	System Administrator	1	1	t	2026-06-25 08:45:19.596+03	\N	2026-06-25 08:07:14.498+03	2026-06-25 08:45:19.597+03
\.


--
-- Name: attendance_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_records_id_seq', 1, false);


--
-- Name: carry_forwards_carry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carry_forwards_carry_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 1, false);


--
-- Name: compensation_history_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.compensation_history_history_id_seq', 1, false);


--
-- Name: deduction_applications_application_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.deduction_applications_application_id_seq', 1, false);


--
-- Name: departments_department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_department_id_seq', 1, false);


--
-- Name: employee_documents_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_documents_document_id_seq', 1, false);


--
-- Name: employee_penalties_penalty_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_penalties_penalty_id_seq', 1, false);


--
-- Name: employees_employee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_employee_id_seq', 1, false);


--
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.groups_id_seq', 1, false);


--
-- Name: hold_releases_release_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hold_releases_release_id_seq', 1, false);


--
-- Name: import_batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.import_batches_id_seq', 1, false);


--
-- Name: import_errors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.import_errors_id_seq', 1, false);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.items_id_seq', 1, false);


--
-- Name: leave_balances_leave_balance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_balances_leave_balance_id_seq', 1, false);


--
-- Name: leave_extensions_extension_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_extensions_extension_id_seq', 1, false);


--
-- Name: leave_notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_notifications_notification_id_seq', 1, false);


--
-- Name: leave_requests_leave_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_requests_leave_request_id_seq', 1, false);


--
-- Name: leave_types_leave_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_types_leave_type_id_seq', 1, false);


--
-- Name: onhold_payroll_details_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.onhold_payroll_details_detail_id_seq', 1, false);


--
-- Name: onhold_payroll_onhold_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.onhold_payroll_onhold_id_seq', 1, false);


--
-- Name: payment_sessions_session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_sessions_session_id_seq', 1, false);


--
-- Name: payment_transactions_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_transactions_transaction_id_seq', 1, false);


--
-- Name: payroll_history_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payroll_history_history_id_seq', 1, false);


--
-- Name: payroll_items_payroll_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payroll_items_payroll_item_id_seq', 1, false);


--
-- Name: payroll_periods_period_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payroll_periods_period_id_seq', 1, false);


--
-- Name: payroll_processing_processing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payroll_processing_processing_id_seq', 1, false);


--
-- Name: penalty_deductions_deduction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.penalty_deductions_deduction_id_seq', 1, false);


--
-- Name: penalty_reduction_rules_rule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.penalty_reduction_rules_rule_id_seq', 1, false);


--
-- Name: penalty_reductions_reduction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.penalty_reductions_reduction_id_seq', 1, false);


--
-- Name: penalty_summaries_summary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.penalty_summaries_summary_id_seq', 1, false);


--
-- Name: positions_position_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.positions_position_id_seq', 1, false);


--
-- Name: recurring_deductions_deduction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recurring_deductions_deduction_id_seq', 1, false);


--
-- Name: returned_payments_return_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.returned_payments_return_id_seq', 1, false);


--
-- Name: returned_payroll_returned_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.returned_payroll_returned_id_seq', 1, false);


--
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 1, false);


--
-- Name: salary_holds_hold_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.salary_holds_hold_id_seq', 1, false);


--
-- Name: store_group_relations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.store_group_relations_id_seq', 1, false);


--
-- Name: stores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stores_id_seq', 1, false);


--
-- Name: system_settings_setting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_settings_setting_id_seq', 1, false);


--
-- Name: unclaimed_payroll_unclaimed_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.unclaimed_payroll_unclaimed_id_seq', 1, false);


--
-- Name: unclaimed_salaries_unclaimed_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.unclaimed_salaries_unclaimed_id_seq', 1, false);


--
-- Name: uom_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.uom_id_seq', 1, false);


--
-- Name: user_group_relations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_group_relations_id_seq', 1, false);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 1, false);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: attendance_records attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);


--
-- Name: carry_forwards carry_forwards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carry_forwards
    ADD CONSTRAINT carry_forwards_pkey PRIMARY KEY (carry_id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: compensation_history compensation_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compensation_history
    ADD CONSTRAINT compensation_history_pkey PRIMARY KEY (history_id);


--
-- Name: deduction_applications deduction_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deduction_applications
    ADD CONSTRAINT deduction_applications_pkey PRIMARY KEY (application_id);


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);


--
-- Name: employee_documents employee_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT employee_documents_pkey PRIMARY KEY (document_id);


--
-- Name: employee_penalties employee_penalties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_penalties
    ADD CONSTRAINT employee_penalties_pkey PRIMARY KEY (penalty_id);


--
-- Name: employees employees_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_code_key UNIQUE (employee_code);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (employee_id);


--
-- Name: groups groups_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_code_key UNIQUE (code);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: hold_releases hold_releases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hold_releases
    ADD CONSTRAINT hold_releases_pkey PRIMARY KEY (release_id);


--
-- Name: import_batches import_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_batches
    ADD CONSTRAINT import_batches_pkey PRIMARY KEY (id);


--
-- Name: import_errors import_errors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_errors
    ADD CONSTRAINT import_errors_pkey PRIMARY KEY (id);


--
-- Name: items items_barcode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_barcode_key UNIQUE (barcode);


--
-- Name: items items_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_code_key UNIQUE (code);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: leave_balances leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_pkey PRIMARY KEY (leave_balance_id);


--
-- Name: leave_extensions leave_extensions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_extensions
    ADD CONSTRAINT leave_extensions_pkey PRIMARY KEY (extension_id);


--
-- Name: leave_notifications leave_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_notifications
    ADD CONSTRAINT leave_notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (leave_request_id);


--
-- Name: leave_types leave_types_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_code_key UNIQUE (code);


--
-- Name: leave_types leave_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_name_key UNIQUE (name);


--
-- Name: leave_types leave_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_pkey PRIMARY KEY (leave_type_id);


--
-- Name: onhold_payroll_details onhold_payroll_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onhold_payroll_details
    ADD CONSTRAINT onhold_payroll_details_pkey PRIMARY KEY (detail_id);


--
-- Name: onhold_payroll onhold_payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onhold_payroll
    ADD CONSTRAINT onhold_payroll_pkey PRIMARY KEY (onhold_id);


--
-- Name: payment_sessions payment_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_sessions
    ADD CONSTRAINT payment_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: payment_sessions payment_sessions_session_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_sessions
    ADD CONSTRAINT payment_sessions_session_code_key UNIQUE (session_code);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: payroll_history payroll_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_history
    ADD CONSTRAINT payroll_history_pkey PRIMARY KEY (history_id);


--
-- Name: payroll_items payroll_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_items
    ADD CONSTRAINT payroll_items_pkey PRIMARY KEY (payroll_item_id);


--
-- Name: payroll_periods payroll_periods_period_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_period_code_key UNIQUE (period_code);


--
-- Name: payroll_periods payroll_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_pkey PRIMARY KEY (period_id);


--
-- Name: payroll_processing payroll_processing_month_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_processing
    ADD CONSTRAINT payroll_processing_month_year_key UNIQUE (month_year);


--
-- Name: payroll_processing payroll_processing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_processing
    ADD CONSTRAINT payroll_processing_pkey PRIMARY KEY (processing_id);


--
-- Name: penalty_deductions penalty_deductions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_deductions
    ADD CONSTRAINT penalty_deductions_pkey PRIMARY KEY (deduction_id);


--
-- Name: penalty_reduction_rules penalty_reduction_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_reduction_rules
    ADD CONSTRAINT penalty_reduction_rules_pkey PRIMARY KEY (rule_id);


--
-- Name: penalty_reductions penalty_reductions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_reductions
    ADD CONSTRAINT penalty_reductions_pkey PRIMARY KEY (reduction_id);


--
-- Name: penalty_summaries penalty_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_summaries
    ADD CONSTRAINT penalty_summaries_pkey PRIMARY KEY (summary_id);


--
-- Name: positions positions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_code_key UNIQUE (code);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (position_id);


--
-- Name: recurring_deductions recurring_deductions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_deductions
    ADD CONSTRAINT recurring_deductions_pkey PRIMARY KEY (deduction_id);


--
-- Name: returned_payments returned_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_payments
    ADD CONSTRAINT returned_payments_pkey PRIMARY KEY (return_id);


--
-- Name: returned_payroll returned_payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_payroll
    ADD CONSTRAINT returned_payroll_pkey PRIMARY KEY (returned_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- Name: salary_holds salary_holds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_holds
    ADD CONSTRAINT salary_holds_pkey PRIMARY KEY (hold_id);


--
-- Name: store_group_relations store_group_relations_group_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_group_relations
    ADD CONSTRAINT store_group_relations_group_id_key UNIQUE (group_id);


--
-- Name: store_group_relations store_group_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_group_relations
    ADD CONSTRAINT store_group_relations_pkey PRIMARY KEY (id);


--
-- Name: store_group_relations store_group_relations_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_group_relations
    ADD CONSTRAINT store_group_relations_store_id_key UNIQUE (store_id);


--
-- Name: stores stores_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_code_key UNIQUE (code);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (setting_id);


--
-- Name: system_settings system_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: unclaimed_payroll unclaimed_payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unclaimed_payroll
    ADD CONSTRAINT unclaimed_payroll_pkey PRIMARY KEY (unclaimed_id);


--
-- Name: unclaimed_salaries unclaimed_salaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unclaimed_salaries
    ADD CONSTRAINT unclaimed_salaries_pkey PRIMARY KEY (unclaimed_id);


--
-- Name: uom uom_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uom
    ADD CONSTRAINT uom_code_key UNIQUE (code);


--
-- Name: uom uom_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.uom
    ADD CONSTRAINT uom_pkey PRIMARY KEY (id);


--
-- Name: user_group_relations user_group_relations_group_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_group_relations
    ADD CONSTRAINT user_group_relations_group_id_key UNIQUE (group_id);


--
-- Name: user_group_relations user_group_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_group_relations
    ADD CONSTRAINT user_group_relations_pkey PRIMARY KEY (id);


--
-- Name: user_group_relations user_group_relations_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_group_relations
    ADD CONSTRAINT user_group_relations_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: attendance_records attendance_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: attendance_records attendance_records_import_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_import_batch_id_fkey FOREIGN KEY (import_batch_id) REFERENCES public.import_batches(id) ON UPDATE CASCADE;


--
-- Name: carry_forwards carry_forwards_cleared_in_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carry_forwards
    ADD CONSTRAINT carry_forwards_cleared_in_period_id_fkey FOREIGN KEY (cleared_in_period_id) REFERENCES public.payroll_periods(period_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: carry_forwards carry_forwards_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carry_forwards
    ADD CONSTRAINT carry_forwards_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: carry_forwards carry_forwards_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carry_forwards
    ADD CONSTRAINT carry_forwards_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(period_id) ON UPDATE CASCADE;


--
-- Name: compensation_history compensation_history_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compensation_history
    ADD CONSTRAINT compensation_history_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: compensation_history compensation_history_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compensation_history
    ADD CONSTRAINT compensation_history_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: deduction_applications deduction_applications_deduction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deduction_applications
    ADD CONSTRAINT deduction_applications_deduction_id_fkey FOREIGN KEY (deduction_id) REFERENCES public.recurring_deductions(deduction_id) ON UPDATE CASCADE;


--
-- Name: deduction_applications deduction_applications_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deduction_applications
    ADD CONSTRAINT deduction_applications_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: deduction_applications deduction_applications_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deduction_applications
    ADD CONSTRAINT deduction_applications_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(period_id) ON UPDATE CASCADE;


--
-- Name: deduction_applications deduction_applications_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deduction_applications
    ADD CONSTRAINT deduction_applications_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: departments departments_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: departments departments_parent_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_department_id_fkey FOREIGN KEY (parent_department_id) REFERENCES public.departments(department_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employee_documents employee_documents_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT employee_documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: employee_documents employee_documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT employee_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employee_penalties employee_penalties_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_penalties
    ADD CONSTRAINT employee_penalties_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employee_penalties employee_penalties_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_penalties
    ADD CONSTRAINT employee_penalties_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: employee_penalties employee_penalties_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_penalties
    ADD CONSTRAINT employee_penalties_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(period_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employees employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employees employees_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employees employees_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(position_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employees employees_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE;


--
-- Name: hold_releases hold_releases_applied_to_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hold_releases
    ADD CONSTRAINT hold_releases_applied_to_period_id_fkey FOREIGN KEY (applied_to_period_id) REFERENCES public.payroll_periods(period_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: hold_releases hold_releases_hold_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hold_releases
    ADD CONSTRAINT hold_releases_hold_id_fkey FOREIGN KEY (hold_id) REFERENCES public.salary_holds(hold_id) ON UPDATE CASCADE;


--
-- Name: hold_releases hold_releases_released_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hold_releases
    ADD CONSTRAINT hold_releases_released_by_fkey FOREIGN KEY (released_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: import_errors import_errors_import_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_errors
    ADD CONSTRAINT import_errors_import_batch_id_fkey FOREIGN KEY (import_batch_id) REFERENCES public.import_batches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: items items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: items items_conversion_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_conversion_uom_id_fkey FOREIGN KEY (conversion_uom_id) REFERENCES public.uom(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: items items_uom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_uom_id_fkey FOREIGN KEY (uom_id) REFERENCES public.uom(id) ON UPDATE CASCADE;


--
-- Name: leave_balances leave_balances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: leave_extensions leave_extensions_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_extensions
    ADD CONSTRAINT leave_extensions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: leave_extensions leave_extensions_leave_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_extensions
    ADD CONSTRAINT leave_extensions_leave_request_id_fkey FOREIGN KEY (leave_request_id) REFERENCES public.leave_requests(leave_request_id) ON UPDATE CASCADE;


--
-- Name: leave_extensions leave_extensions_rejected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_extensions
    ADD CONSTRAINT leave_extensions_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: leave_notifications leave_notifications_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_notifications
    ADD CONSTRAINT leave_notifications_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: leave_notifications leave_notifications_leave_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_notifications
    ADD CONSTRAINT leave_notifications_leave_request_id_fkey FOREIGN KEY (leave_request_id) REFERENCES public.leave_requests(leave_request_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: leave_requests leave_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: leave_requests leave_requests_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: leave_requests leave_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: leave_requests leave_requests_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(leave_type_id) ON UPDATE CASCADE;


--
-- Name: leave_requests leave_requests_rejected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: leave_requests leave_requests_return_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_return_confirmed_by_fkey FOREIGN KEY (return_confirmed_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: onhold_payroll_details onhold_payroll_details_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onhold_payroll_details
    ADD CONSTRAINT onhold_payroll_details_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: onhold_payroll_details onhold_payroll_details_onhold_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onhold_payroll_details
    ADD CONSTRAINT onhold_payroll_details_onhold_id_fkey FOREIGN KEY (onhold_id) REFERENCES public.onhold_payroll(onhold_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: onhold_payroll_details onhold_payroll_details_payment_history_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onhold_payroll_details
    ADD CONSTRAINT onhold_payroll_details_payment_history_id_fkey FOREIGN KEY (payment_history_id) REFERENCES public.payroll_history(history_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: onhold_payroll onhold_payroll_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onhold_payroll
    ADD CONSTRAINT onhold_payroll_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: payment_sessions payment_sessions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_sessions
    ADD CONSTRAINT payment_sessions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payment_sessions payment_sessions_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_sessions
    ADD CONSTRAINT payment_sessions_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(period_id) ON UPDATE CASCADE;


--
-- Name: payment_transactions payment_transactions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: payment_transactions payment_transactions_payroll_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_payroll_item_id_fkey FOREIGN KEY (payroll_item_id) REFERENCES public.payroll_items(payroll_item_id) ON UPDATE CASCADE;


--
-- Name: payment_transactions payment_transactions_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(period_id) ON UPDATE CASCADE;


--
-- Name: payment_transactions payment_transactions_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payment_transactions payment_transactions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.payment_sessions(session_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payroll_history payroll_history_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_history
    ADD CONSTRAINT payroll_history_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: payroll_history payroll_history_payroll_processing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_history
    ADD CONSTRAINT payroll_history_payroll_processing_id_fkey FOREIGN KEY (payroll_processing_id) REFERENCES public.payroll_processing(processing_id) ON UPDATE CASCADE;


--
-- Name: payroll_items payroll_items_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_items
    ADD CONSTRAINT payroll_items_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: payroll_items payroll_items_hold_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_items
    ADD CONSTRAINT payroll_items_hold_id_fkey FOREIGN KEY (hold_id) REFERENCES public.salary_holds(hold_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payroll_items payroll_items_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_items
    ADD CONSTRAINT payroll_items_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(period_id) ON UPDATE CASCADE;


--
-- Name: payroll_periods payroll_periods_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: penalty_deductions penalty_deductions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_deductions
    ADD CONSTRAINT penalty_deductions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: penalty_deductions penalty_deductions_summary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_deductions
    ADD CONSTRAINT penalty_deductions_summary_id_fkey FOREIGN KEY (summary_id) REFERENCES public.penalty_summaries(summary_id) ON UPDATE CASCADE;


--
-- Name: penalty_reduction_rules penalty_reduction_rules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_reduction_rules
    ADD CONSTRAINT penalty_reduction_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: penalty_reductions penalty_reductions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_reductions
    ADD CONSTRAINT penalty_reductions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: penalty_reductions penalty_reductions_penalty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_reductions
    ADD CONSTRAINT penalty_reductions_penalty_id_fkey FOREIGN KEY (penalty_id) REFERENCES public.attendance_records(id) ON UPDATE CASCADE;


--
-- Name: penalty_reductions penalty_reductions_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_reductions
    ADD CONSTRAINT penalty_reductions_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(period_id) ON UPDATE CASCADE;


--
-- Name: penalty_reductions penalty_reductions_reduced_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_reductions
    ADD CONSTRAINT penalty_reductions_reduced_by_fkey FOREIGN KEY (reduced_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: penalty_summaries penalty_summaries_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penalty_summaries
    ADD CONSTRAINT penalty_summaries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: positions positions_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: recurring_deductions recurring_deductions_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_deductions
    ADD CONSTRAINT recurring_deductions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: recurring_deductions recurring_deductions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_deductions
    ADD CONSTRAINT recurring_deductions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: returned_payments returned_payments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_payments
    ADD CONSTRAINT returned_payments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: returned_payments returned_payments_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_payments
    ADD CONSTRAINT returned_payments_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: returned_payments returned_payments_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_payments
    ADD CONSTRAINT returned_payments_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.payment_transactions(transaction_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: returned_payroll returned_payroll_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_payroll
    ADD CONSTRAINT returned_payroll_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: returned_payroll returned_payroll_original_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_payroll
    ADD CONSTRAINT returned_payroll_original_payment_id_fkey FOREIGN KEY (original_payment_id) REFERENCES public.payroll_history(history_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: returned_payroll returned_payroll_payment_history_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_payroll
    ADD CONSTRAINT returned_payroll_payment_history_id_fkey FOREIGN KEY (payment_history_id) REFERENCES public.payroll_history(history_id);


--
-- Name: returned_payroll returned_payroll_payroll_processing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.returned_payroll
    ADD CONSTRAINT returned_payroll_payroll_processing_id_fkey FOREIGN KEY (payroll_processing_id) REFERENCES public.payroll_processing(processing_id) ON UPDATE CASCADE;


--
-- Name: salary_holds salary_holds_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_holds
    ADD CONSTRAINT salary_holds_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: salary_holds salary_holds_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_holds
    ADD CONSTRAINT salary_holds_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: salary_holds salary_holds_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_holds
    ADD CONSTRAINT salary_holds_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(period_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: salary_holds salary_holds_released_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_holds
    ADD CONSTRAINT salary_holds_released_by_fkey FOREIGN KEY (released_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: store_group_relations store_group_relations_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_group_relations
    ADD CONSTRAINT store_group_relations_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: store_group_relations store_group_relations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.store_group_relations
    ADD CONSTRAINT store_group_relations_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: system_settings system_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: unclaimed_payroll unclaimed_payroll_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unclaimed_payroll
    ADD CONSTRAINT unclaimed_payroll_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: unclaimed_payroll unclaimed_payroll_payroll_processing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unclaimed_payroll
    ADD CONSTRAINT unclaimed_payroll_payroll_processing_id_fkey FOREIGN KEY (payroll_processing_id) REFERENCES public.payroll_processing(processing_id) ON UPDATE CASCADE;


--
-- Name: unclaimed_salaries unclaimed_salaries_claimed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unclaimed_salaries
    ADD CONSTRAINT unclaimed_salaries_claimed_by_fkey FOREIGN KEY (claimed_by) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: unclaimed_salaries unclaimed_salaries_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unclaimed_salaries
    ADD CONSTRAINT unclaimed_salaries_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON UPDATE CASCADE;


--
-- Name: unclaimed_salaries unclaimed_salaries_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unclaimed_salaries
    ADD CONSTRAINT unclaimed_salaries_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payroll_periods(period_id) ON UPDATE CASCADE;


--
-- Name: unclaimed_salaries unclaimed_salaries_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unclaimed_salaries
    ADD CONSTRAINT unclaimed_salaries_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.payment_transactions(transaction_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_group_relations user_group_relations_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_group_relations
    ADD CONSTRAINT user_group_relations_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_group_relations user_group_relations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_group_relations
    ADD CONSTRAINT user_group_relations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict HmDLjDtbHtzsNNgLtjgzOVZLxE5nOg2aKpcL3JGcCQweOknUPWPxE6RZ6rhYlkE

