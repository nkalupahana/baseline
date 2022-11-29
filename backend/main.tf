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
  display_name = "backend-public"
  names        = ["backend-public"]
  description  = "Service account for public backend (tf managed)"
  project_roles = [
    "${var.project}=>roles/firebaseauth.admin",
    "${var.project}=>roles/firebasedatabase.admin",
    "${var.project}=>roles/storage.objectAdmin",
    "${var.project}=>roles/secretmanager.secretAccessor"
  ]
}

resource "google_service_account_iam_member" "give-perms-to-gh-actions" {
  service_account_id = "111514687893826631162" # id for gh actions account
  role               = "roles/iam.serviceAccountAdmin"
  member             = "serviceAccount:${module.service-accounts.email}"
}