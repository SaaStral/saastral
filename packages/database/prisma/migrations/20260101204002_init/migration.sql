-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('active', 'suspended', 'offboarded');

-- CreateEnum
CREATE TYPE "SubscriptionCategory" AS ENUM ('productivity', 'development', 'design', 'infrastructure', 'sales_marketing', 'communication', 'finance', 'hr', 'security', 'analytics', 'support', 'other');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('monthly', 'quarterly', 'semiannual', 'annual', 'biennial', 'usage_based', 'one_time');

-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('per_seat', 'per_active_user', 'flat_rate', 'tiered', 'usage_based', 'freemium', 'hybrid');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('named', 'concurrent', 'floating', 'unlimited');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('credit_card', 'debit_card', 'invoice', 'bank_transfer', 'pix', 'paypal', 'wire_transfer', 'marketplace', 'other');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('saas', 'enterprise', 'free', 'trial');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'trial', 'suspended', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('offboarding', 'renewal_upcoming', 'unused_license', 'low_utilization', 'duplicate_tool', 'cost_anomaly', 'seat_shortage', 'trial_ending');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('pending', 'acknowledged', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('google', 'okta', 'microsoft', 'keycloak');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('pending', 'active', 'error', 'disabled');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'admin', 'member', 'viewer');

-- CreateEnum
CREATE TYPE "SubscriptionUserStatus" AS ENUM ('active', 'inactive', 'revoked');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'community',
    "plan_started_at" TIMESTAMP(3),
    "plan_expires_at" TIMESTAMP(3),
    "settings" JSONB NOT NULL DEFAULT '{"timezone":"America/Sao_Paulo","currency":"BRL","alertDefaults":{"unusedLicenseDays":30,"lowUtilizationThreshold":50,"renewalReminderDays":[30,15,7]}}',
    "logo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "password_hash" TEXT,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "preferences" JSONB NOT NULL DEFAULT '{"language":"pt-BR","notifications":{"email":true,"inApp":true}}',
    "last_login_at" TIMESTAMP(3),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'member',
    "invited_by" TEXT,
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "external_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "title" TEXT,
    "phone" TEXT,
    "avatar_url" TEXT,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'active',
    "department_id" TEXT,
    "manager_id" TEXT,
    "hired_at" DATE,
    "offboarded_at" DATE,
    "external_id" TEXT,
    "external_provider" "IntegrationProvider",
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "monthly_saas_cost" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendor" TEXT,
    "category" "SubscriptionCategory" NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "tags" TEXT[],
    "status" "SubscriptionStatus" NOT NULL,
    "contract_type" "ContractType",
    "billing_cycle" "BillingCycle" NOT NULL,
    "pricing_model" "PricingModel" NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BRL',
    "price_per_unit" DECIMAL(12,2),
    "total_monthly_cost" DECIMAL(12,2) NOT NULL,
    "annual_value" DECIMAL(14,2),
    "discount_percentage" DECIMAL(5,2),
    "original_price" DECIMAL(12,2),
    "price_increase_cap" DECIMAL(5,2),
    "total_seats" INTEGER,
    "used_seats" INTEGER NOT NULL DEFAULT 0,
    "seats_unlimited" BOOLEAN NOT NULL DEFAULT false,
    "license_type" "LicenseType",
    "payment_method" "PaymentMethod",
    "billing_email" TEXT,
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "cost_center" TEXT,
    "budget_code" TEXT,
    "start_date" DATE NOT NULL,
    "renewal_date" DATE NOT NULL,
    "cancellation_deadline" DATE,
    "trial_end_date" DATE,
    "reminder_days" INTEGER[] DEFAULT ARRAY[30, 15, 7]::INTEGER[],
    "owner_id" TEXT,
    "department_id" TEXT,
    "approver_id" TEXT,
    "vendor_contact" JSONB,
    "notes" TEXT,
    "integration_id" TEXT,
    "sso_app_id" TEXT,
    "usage_percentage" DECIMAL(5,2),
    "last_usage_calculated_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_users" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "status" "SubscriptionUserStatus" NOT NULL DEFAULT 'active',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT,
    "revoked_at" TIMESTAMP(3),
    "revoked_by" TEXT,
    "last_used_at" TIMESTAMP(3),
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "encrypted_credentials" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{"syncEnabled":true,"syncIntervalMinutes":60}',
    "provider_config" JSONB NOT NULL DEFAULT '{}',
    "last_sync_at" TIMESTAMP(3),
    "last_sync_status" TEXT,
    "last_sync_message" TEXT,
    "sync_stats" JSONB,
    "last_tested_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "subscription_id" TEXT,
    "integration_id" TEXT,
    "event_type" TEXT NOT NULL,
    "app_name" TEXT NOT NULL,
    "app_id" TEXT,
    "user_email" TEXT NOT NULL,
    "user_name" TEXT,
    "session_id" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "location" JSONB,
    "event_at" TIMESTAMP(3) NOT NULL,
    "raw_event" JSONB,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'warning',
    "status" "AlertStatus" NOT NULL DEFAULT 'pending',
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "employee_id" TEXT,
    "subscription_id" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "potential_savings" DECIMAL(12,2),
    "currency" CHAR(3) DEFAULT 'BRL',
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "resolution_notes" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "acknowledged_by" TEXT,
    "dismissed_at" TIMESTAMP(3),
    "dismissed_by" TEXT,
    "dismiss_reason" TEXT,
    "snoozed_until" TIMESTAMP(3),
    "snoozed_by" TEXT,
    "alert_key" VARCHAR(500),
    "notification_sent_at" TIMESTAMP(3),
    "notification_channel" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(100),
    "file_size" BIGINT,
    "storage_provider" VARCHAR(50) NOT NULL DEFAULT 'minio',
    "storage_key" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_email" VARCHAR(255),
    "user_name" VARCHAR(255),
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entityId" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT,
    "channel" VARCHAR(50) NOT NULL,
    "recipient_address" VARCHAR(255),
    "type" VARCHAR(100) NOT NULL,
    "subject" VARCHAR(500),
    "body" TEXT,
    "alert_id" TEXT,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3),
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "sync_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "error_message" TEXT,
    "sync_stats" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "triggered_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_history" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "year_month" DATE NOT NULL,
    "total_cost" DECIMAL(14,2) NOT NULL,
    "total_subscriptions" INTEGER NOT NULL,
    "total_employees" INTEGER NOT NULL,
    "total_seats" INTEGER,
    "used_seats" INTEGER,
    "cost_by_category" JSONB NOT NULL DEFAULT '{}',
    "cost_by_department" JSONB NOT NULL DEFAULT '{}',
    "potential_savings" DECIMAL(14,2),
    "realized_savings" DECIMAL(14,2),
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_catalog" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "vendor" VARCHAR(255),
    "category" "SubscriptionCategory" NOT NULL,
    "description" TEXT,
    "website" VARCHAR(500),
    "logo_url" VARCHAR(500),
    "okta_app_name" VARCHAR(255),
    "google_app_name" VARCHAR(255),
    "aliases" TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_domain_idx" ON "organizations"("domain");

-- CreateIndex
CREATE INDEX "organizations_deleted_at_idx" ON "organizations"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "organization_members_organization_id_idx" ON "organization_members"("organization_id");

-- CreateIndex
CREATE INDEX "organization_members_user_id_idx" ON "organization_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "departments_organization_id_idx" ON "departments"("organization_id");

-- CreateIndex
CREATE INDEX "departments_parent_id_idx" ON "departments"("parent_id");

-- CreateIndex
CREATE INDEX "departments_organization_id_external_id_idx" ON "departments"("organization_id", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_organization_id_name_key" ON "departments"("organization_id", "name");

-- CreateIndex
CREATE INDEX "employees_organization_id_idx" ON "employees"("organization_id");

-- CreateIndex
CREATE INDEX "employees_organization_id_status_idx" ON "employees"("organization_id", "status");

-- CreateIndex
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");

-- CreateIndex
CREATE INDEX "employees_manager_id_idx" ON "employees"("manager_id");

-- CreateIndex
CREATE INDEX "employees_organization_id_external_id_idx" ON "employees"("organization_id", "external_id");

-- CreateIndex
CREATE INDEX "employees_organization_id_email_idx" ON "employees"("organization_id", "email");

-- CreateIndex
CREATE INDEX "employees_organization_id_offboarded_at_idx" ON "employees"("organization_id", "offboarded_at");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organization_id_email_key" ON "employees"("organization_id", "email");

-- CreateIndex
CREATE INDEX "subscriptions_organization_id_idx" ON "subscriptions"("organization_id");

-- CreateIndex
CREATE INDEX "subscriptions_organization_id_status_idx" ON "subscriptions"("organization_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_organization_id_category_idx" ON "subscriptions"("organization_id", "category");

-- CreateIndex
CREATE INDEX "subscriptions_renewal_date_idx" ON "subscriptions"("renewal_date");

-- CreateIndex
CREATE INDEX "subscriptions_owner_id_idx" ON "subscriptions"("owner_id");

-- CreateIndex
CREATE INDEX "subscriptions_department_id_idx" ON "subscriptions"("department_id");

-- CreateIndex
CREATE INDEX "subscriptions_organization_id_total_monthly_cost_idx" ON "subscriptions"("organization_id", "total_monthly_cost");

-- CreateIndex
CREATE INDEX "subscriptions_tags_idx" ON "subscriptions"("tags");

-- CreateIndex
CREATE INDEX "subscription_users_subscription_id_idx" ON "subscription_users"("subscription_id");

-- CreateIndex
CREATE INDEX "subscription_users_employee_id_idx" ON "subscription_users"("employee_id");

-- CreateIndex
CREATE INDEX "subscription_users_subscription_id_status_idx" ON "subscription_users"("subscription_id", "status");

-- CreateIndex
CREATE INDEX "subscription_users_last_used_at_idx" ON "subscription_users"("last_used_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_users_subscription_id_employee_id_key" ON "subscription_users"("subscription_id", "employee_id");

-- CreateIndex
CREATE INDEX "integrations_organization_id_idx" ON "integrations"("organization_id");

-- CreateIndex
CREATE INDEX "integrations_organization_id_provider_idx" ON "integrations"("organization_id", "provider");

-- CreateIndex
CREATE INDEX "integrations_status_idx" ON "integrations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_organization_id_provider_key" ON "integrations"("organization_id", "provider");

-- CreateIndex
CREATE INDEX "login_events_organization_id_event_at_idx" ON "login_events"("organization_id", "event_at");

-- CreateIndex
CREATE INDEX "login_events_employee_id_event_at_idx" ON "login_events"("employee_id", "event_at");

-- CreateIndex
CREATE INDEX "login_events_subscription_id_event_at_idx" ON "login_events"("subscription_id", "event_at");

-- CreateIndex
CREATE INDEX "login_events_organization_id_app_name_event_at_idx" ON "login_events"("organization_id", "app_name", "event_at");

-- CreateIndex
CREATE INDEX "login_events_organization_id_user_email_event_at_idx" ON "login_events"("organization_id", "user_email", "event_at");

-- CreateIndex
CREATE INDEX "alerts_organization_id_idx" ON "alerts"("organization_id");

-- CreateIndex
CREATE INDEX "alerts_organization_id_status_idx" ON "alerts"("organization_id", "status");

-- CreateIndex
CREATE INDEX "alerts_organization_id_type_idx" ON "alerts"("organization_id", "type");

-- CreateIndex
CREATE INDEX "alerts_organization_id_severity_idx" ON "alerts"("organization_id", "severity");

-- CreateIndex
CREATE INDEX "alerts_employee_id_idx" ON "alerts"("employee_id");

-- CreateIndex
CREATE INDEX "alerts_subscription_id_idx" ON "alerts"("subscription_id");

-- CreateIndex
CREATE INDEX "alerts_organization_id_created_at_idx" ON "alerts"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "alerts_organization_id_alert_key_idx" ON "alerts"("organization_id", "alert_key");

-- CreateIndex
CREATE UNIQUE INDEX "alerts_organization_id_alert_key_key" ON "alerts"("organization_id", "alert_key");

-- CreateIndex
CREATE INDEX "documents_organization_id_idx" ON "documents"("organization_id");

-- CreateIndex
CREATE INDEX "documents_entity_type_entity_id_idx" ON "documents"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entityId_created_at_idx" ON "audit_logs"("entity_type", "entityId", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_action_created_at_idx" ON "audit_logs"("organization_id", "action", "created_at");

-- CreateIndex
CREATE INDEX "notifications_organization_id_idx" ON "notifications"("organization_id");

-- CreateIndex
CREATE INDEX "notifications_scheduled_for_idx" ON "notifications"("scheduled_for");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "sync_logs_organization_id_created_at_idx" ON "sync_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "sync_logs_integration_id_created_at_idx" ON "sync_logs"("integration_id", "created_at");

-- CreateIndex
CREATE INDEX "cost_history_organization_id_year_month_idx" ON "cost_history"("organization_id", "year_month");

-- CreateIndex
CREATE UNIQUE INDEX "cost_history_organization_id_year_month_key" ON "cost_history"("organization_id", "year_month");

-- CreateIndex
CREATE UNIQUE INDEX "saas_catalog_name_key" ON "saas_catalog"("name");

-- CreateIndex
CREATE INDEX "saas_catalog_name_idx" ON "saas_catalog"("name");

-- CreateIndex
CREATE INDEX "saas_catalog_category_idx" ON "saas_catalog"("category");

-- CreateIndex
CREATE INDEX "saas_catalog_aliases_idx" ON "saas_catalog"("aliases");

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_users" ADD CONSTRAINT "subscription_users_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_users" ADD CONSTRAINT "subscription_users_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_users" ADD CONSTRAINT "subscription_users_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_users" ADD CONSTRAINT "subscription_users_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_events" ADD CONSTRAINT "login_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_events" ADD CONSTRAINT "login_events_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_events" ADD CONSTRAINT "login_events_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_events" ADD CONSTRAINT "login_events_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_dismissed_by_fkey" FOREIGN KEY ("dismissed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_snoozed_by_fkey" FOREIGN KEY ("snoozed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_history" ADD CONSTRAINT "cost_history_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
