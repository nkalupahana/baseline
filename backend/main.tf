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
    "${var.project}=>roles/secretmanager.secretAccessor",
    "${var.project}=>roles/pubsub.publisher",
    "${var.project}=>roles/datastore.user",
  ]
}

resource "google_service_account_iam_member" "give-perms-to-gh-actions" {
  service_account_id  = module.service-accounts.service_account.id
  role                = "roles/iam.serviceAccountUser"
  member              = "serviceAccount:github-action-420733850@getbaselineapp.iam.gserviceaccount.com"
}