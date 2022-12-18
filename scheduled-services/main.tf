variable "project" {
  type    = string
  default = "getbaselineapp"
}

variable "endpoint" {
  type    = string
  default = "https://scheduled-services-lg27dbkpuq-uc.a.run.app"
}

variable "gh-actions-sa" {
  type    = string
  default = "github-action-420733850"
}

provider "google" {
  project = var.project
  region  = "us-central1"
}

module "scheduled-services-sa" {
  source       = "terraform-google-modules/service-accounts/google"
  version      = "4.1.1"
  project_id   = var.project
  display_name = "scheduled-services"
  names        = ["scheduled-services"]
  description  = "Service account for scheduled services (tf managed)"
  project_roles = [
    "${var.project}=>roles/bigquery.admin",
    "${var.project}=>roles/run.invoker",
    "${var.project}=>roles/firebasedatabase.admin",
    "${var.project}=>roles/storage.admin",
    "${var.project}=>roles/firebaseauth.admin",
    "${var.project}=>roles/firebasenotifications.admin",
    "${var.project}=>roles/firebasecloudmessaging.admin",
  ]
}

resource "google_cloud_scheduler_job" "send_clean_up_messages" {
  name             = "send_clean_up_messages"
  description      = "Send clean up messages"
  schedule         = "0 */2 * * *"
  time_zone        = "America/Chicago"
  attempt_deadline = "600s"

  http_target {
    http_method = "POST"
    uri         = "${var.endpoint}/messaging/cleanup"

    oidc_token {
      service_account_email = module.scheduled-services-sa.email
    }
  }
}

resource "google_cloud_scheduler_job" "clean_up_quotas" {
  name             = "clean_up_quotas"
  description      = "Clean up quota database"
  schedule         = "0 0 * * *"
  time_zone        = "America/Chicago"
  attempt_deadline = "30s"

  http_target {
    http_method = "POST"
    uri         = "${var.endpoint}/cleanup/quotas"

    oidc_token {
      service_account_email = module.scheduled-services-sa.email
    }
  }
}

resource "google_cloud_scheduler_job" "clean_up_anonymous" {
  name             = "clean_up_anonymous"
  description      = "Clean up anonymous accounts"
  schedule         = "0 0 * * SUN"
  time_zone        = "America/Chicago"
  attempt_deadline = "600s"

  http_target {
    http_method = "POST"
    uri         = "${var.endpoint}/cleanup/anonymous"

    oidc_token {
      service_account_email = module.scheduled-services-sa.email
    }
  }
}

resource "google_cloud_scheduler_job" "bi_and_retention_messaging" {
  name             = "bi_and_retention_messaging"
  description      = "Send data to BigQuery, and kick off retention messaging based on data"
  schedule         = "0 */2 * * *"
  time_zone        = "America/Chicago"
  attempt_deadline = "1800s"

  http_target {
    http_method = "POST"
    uri         = "${var.endpoint}/bi"

    oidc_token {
      service_account_email = module.scheduled-services-sa.email
    }
  }
}

resource "google_service_account_iam_member" "give-perms-to-gh-actions" {
  service_account_id  = module.scheduled-services-sa.service_account.id
  role                = "roles/iam.serviceAccountUser"
  member              = "serviceAccount:${gh-actions-sa}@${var.project}.iam.gserviceaccount.com"
}

# Pub/Sub
resource "google_pubsub_topic" "pubsub_trigger_cleanup" {
  name = "pubsub-trigger-cleanup"
}

resource "google_pubsub_subscription" "pubsub_trigger_cleanup_sub" {
  name  = "pubsub-trigger-cleanup-sub"
  topic = google_pubsub_topic.pubsub_trigger_cleanup.name
  push_config {
    push_endpoint = "${var.endpoint}/messaging/removeUserNotifications"
    oidc_token {
      service_account_email = module.scheduled-services-sa.email
      audience = var.endpoint
    }
  }
}