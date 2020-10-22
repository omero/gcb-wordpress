# Title TBD <!-- omit in toc -->

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Infrastructure overview](#infrastructure-overview)
- [Sequence diagram](#sequence-diagram)
- [Secrets setup](#secrets-setup)
- [Frontend CI/CD process](#frontend-cicd-process)
- [Proposed changes to terraform project](#proposed-changes-to-terraform-project)

## Introduction

This architectural reference should help a Proffesional Services Pantheor on how to configure a Frontity-based monorepo project, using Github as a VCS.

- You can take a look on the [wordpress-decoupled-demo](https://github.com/pantheon-systems/wordpress-decoupled-demo) repository to get a fresh start on the specific type of web projects to be deployed using this formula

## Prerequisites

- Good understanding of **terraform** (You should look the [gce-terraform-decoupled](https://github.com/pantheon-systems/gce-terraform-decoupled/) repository, where the latest reference on opinionated creation of GCP infrastructure is referenced. Pay attention to `projects/wordpress-decoupled-demo` for a concrete example)
- A **pantheon.io** Google account with the following associated roles on Google Cloud:
  - `roles/viewer`
  - `roles/secretmanager.admin`
- Have a **Github repository** configured according to [Adding new customer project][1]

## Infrastructure overview

As a whole, the solution should create/update the following GCP resources:

- An Artifact Registry Docker repository
- A Cloud Run Service (based on the image submitted to Artifact Registry)

We'll use the following resources to provision the aforementioned Cloud Run Service:

- Two Cloud Build triggers (as described in [Adding new customer project][1])
  - Note that the file to be read on each trigger differs when doing a PR or a push event. (By default, `pr-build.yaml` and `main-build.yaml` respectively)

Also, you should provide manually the following secrets (procedure described below):

- `[project-id]-github-token`
- `[project-id]-ssh-key`
- `[project-id]-terminus-token`

## Sequence diagram

The following diagram should help to understand the flow logic behind the construction of a Frontity project on GCP. 

![Sequence diagram of a pull-request over a Frontity project](assets/mermaid-frontity.svg)

<details><summary>Show the mermaid code</summary>

```mermaid
sequenceDiagram
    participant U as User
    participant GH as Github
    participant GCB as Google Cloud Build
    participant GCS as Google Cloud Secret Manager
    participant P as Pantheon
    participant GCA as Google Cloud Artifact Registry
    participant GCR as Google Cloud Run
    loop for each pull_request
        U->>+GH: Create
        
        GH->>+GCB: webHook([project-id]-pr-trigger)
        Note right of GH: Notify to GCB
        GCB-->>GH: commitStatus('pending', [project-id]-pr-trigger)
        
        loop steps
          GCB->>+GCS: 1. gcloud secrets ...
          Note right of GCB: Latest version
          GCS-->>-GCB: storeEphemeral(secrets)
          GCB->>+P: 2. Terminus Auth
          GCB-->>GH: 2.1 commitStatus('pending', [project-id]-backend-pr)
          GCB-->>GH: 2.1 commitStatus('pending', [project-id]-frontend-pr)
          par frontend.build
          GCB->>GCB: 3.1.1 Build
          Note right of GCB: For frontend, dir: frontity
          GCB->>+GCA: 3.1.2 Push image
          opt frontend.build == success
          GCB->>GCR: gcloud run deploy frontend ...
          GCR->>GCA: Pull image
          GCA-->>-GCR: Image delivered
          GCR->>GCR: Create and run container
          GCB->>GCR:  Change traffic assignments
          GCB-->>GH: commitStatus('success', [project-id]-frontend-pr)
          end
          and backend.checkout
          GCB->>P: 3.2.1 git setup (dev environment)
          opt backend.checkout == success
          GCB->>P: Cleanup multidev
          GCB->>P: Local repo cloning
          GCB->>P: Push production to Pantheon
          P-->>-GCB: Backend deploy finished
          GCB-->>GH: commitStatus('success', [project-id]-backend-pr)
          Note over GCB,GH: Post a review on PR thread
          GCB-->>-GH: reviews('COMMENT', [markdown-string])
          end
          end
        end
        GH-->>-U: Done
    end

```

</details>

## Secrets setup

> Note: This is a manual process that must be done before even trying to run a Pull Request over the project. Failure to do so results in Google Cloud Build triggers general failure

1. Navigate through the [Google Cloud Console](https://console.cloud.google.com). Locate **Security** on the Navigation menu at left. Then select **Secret Manager**
![Secret manager location on Google Cloud Console](assets/Secrets.png)
2. The related secrets should be labeled with the `frontend_site` variable, defined in the corresponding terraform project. You should add a new version of those secrets over the *Actions* menu > *Add new version*
![Setting new versions for the already defined secrets for the project](assets/Add-Version.png)
3. On the appearing popup, fill the new **secret value**:
![Filling value of the respective secret](assets/Value-Secrets.png)

## Frontend CI/CD process

We use the codebase located in `frontity` folder to deploy a Cloud Run service, taking advantage of Pull Request number to allocate its corresponding URL. For example, if we're doing a Pull Request with ID #5, the Cloud Build configuration file will provision the following resources:

- A new site on *.pantheonsite.io, with a hostname value of `pr-[#id]-[project-name]`

Once Google Cloud Builds finishes the Frontend Deployment, it should add a review over the recently opened PR, as shown in the following image:
![Example of a message shown on the Pull Request thread](assets/PR-message.png)

Once Cloud Build finishes the whole process, you should look for the three checks on succesful state:
![Example of the three checks added at the end of Pull Request](assets/Actions-done.png)



## Proposed changes to terraform project

To work properly, we need to add a new variable on the respective terraform project. Here will be shown the process for manual creation, that should be adapted to the corresponding Infrastructure repository:

1. Navigate through the [Google Cloud Console](https://console.cloud.google.com). Locate **Cloud Build** on the Navigation menu at left. Then select **Triggers**
![Cloud Build triggers location on Google Cloud Console](assets/Triggers.png)
2. Identify the **Add variable** button and click it.
![Add new trigger substitution variable](assets/Add-Variable.png)
3. Create `_GH_REVIEW_URL` with a value of `$(pull_request.pull_request.url)/reviews`.
![Defining new value accordingly](assets/GHS-Value.png)

[1]: https://github.com/pantheon-systems/gce-terraform-decoupled/blob/master/docs/adding-new-projects.md