variable "project" {
  type    = string
  default = "getbaselineapp"
}

provider "google" {
  project = var.project
  region  = "us-central1"
}

module "service-accounts" {
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
    uri         = "https://scheduled-services-lg27dbkpuq-uc.a.run.app/messaging/cleanup"

    oidc_token {
      service_account_email = "scheduled-services@getbaselineapp.iam.gserviceaccount.com"
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
    uri         = "https://scheduled-services-lg27dbkpuq-uc.a.run.app/cleanup/quotas"

    oidc_token {
      service_account_email = "scheduled-services@getbaselineapp.iam.gserviceaccount.com"
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
    uri         = "https://scheduled-services-lg27dbkpuq-uc.a.run.app/cleanup/anonymous"

    oidc_token {
      service_account_email = "scheduled-services@getbaselineapp.iam.gserviceaccount.com"
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
    uri         = "https://scheduled-services-lg27dbkpuq-uc.a.run.app/bi"

    oidc_token {
      service_account_email = "scheduled-services@getbaselineapp.iam.gserviceaccount.com"
    }
  }
}

resource "google_service_account_iam_member" "give-perms-to-gh-actions" {
  service_account_id = "projects/${var.project}/serviceAccounts/github-action-420733850@getbaselineapp.iam.gserviceaccount.com"
  role               = "roles/iam.serviceAccountAdmin"
  member             = "serviceAccount:${module.service-accounts.email}"
}