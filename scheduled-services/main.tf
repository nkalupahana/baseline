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
    "${var.project}=>roles/run.invoker"
  ]
}

resource "google_cloud_scheduler_job" "default" {
  name             = "Every Other Hour"
  description      = "Invoke the default scheduled job to sync data every other hour."
  schedule         = "0 0 1 * *"
  time_zone        = "America/Chicago"
  attempt_deadline = "1800s"

  http_target {
    http_method = "POST"
    uri         = "https://scheduled-services-lg27dbkpuq-uc.a.run.app/"

    oidc_token {
      service_account_email = "scheduled-services@getbaselineapp.iam.gserviceaccount.com"
    }
  }
}
