variable "project" {
    type = string
    default = "getbaselineapp"
}

provider "google" {
    project = var.project
    region  = "us-central1"
}

module "service-accounts" {
    source          = "terraform-google-modules/service-accounts/google"
    version         = "4.1.1"
    project_id      = var.project
    display_name    = "bi-microservices"
    names           = ["bi-microservices"]
    description     = "Service account for bi microservices (tf managed)"
    project_roles   = ["${var.project}=>roles/bigquery.admin"]
}
