# OpenShift Deployment Guide

This guide explains how to deploy the Green Datacenter Selector application to Red Hat OpenShift using Source-to-Image (S2I).

## Prerequisites

- Access to an OpenShift cluster
- OpenShift CLI (`oc`) installed and configured
- Git repository with this code

## Deployment Methods

### Method 1: Using OpenShift Web Console

1. Log in to your OpenShift web console
2. Create a new project or select an existing one
3. Click "Add" → "Import from Git"
4. Enter your Git repository URL
5. OpenShift will auto-detect the Node.js application
6. Configure the following:
   - **Application Name**: green-datacenter-selector
   - **Builder Image**: Node.js (latest or 18+)
   - **Port**: 8080
7. Click "Create"

### Method 2: Using OpenShift CLI

```bash
# Login to OpenShift
oc login <your-openshift-cluster-url>

# Create a new project (optional)
oc new-project green-datacenter-selector

# Create a new application from Git repository
oc new-app nodejs:18-ubi8~https://github.com/your-username/green-datacenter-selector.git \
  --name=green-datacenter-selector

# Expose the service to create a route
oc expose svc/green-datacenter-selector

# Get the route URL
oc get route green-datacenter-selector
```

### Method 3: Using BuildConfig and DeploymentConfig

Create a BuildConfig:

```yaml
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: green-datacenter-selector
spec:
  source:
    type: Git
    git:
      uri: https://github.com/your-username/green-datacenter-selector.git
      ref: main
  strategy:
    type: Source
    sourceStrategy:
      from:
        kind: ImageStreamTag
        name: nodejs:18-ubi8
        namespace: openshift
  output:
    to:
      kind: ImageStreamTag
      name: green-datacenter-selector:latest
```

Apply the configuration:

```bash
oc apply -f buildconfig.yaml
oc start-build green-datacenter-selector
```

## S2I Build Process

The S2I build process uses the following files:

- `.s2i/environment` - Environment variables for the build
- `.s2i/bin/assemble` - Script that runs during the build phase
- `.s2i/bin/run` - Script that runs when the container starts

### Build Steps

1. **Assemble Phase** (`.s2i/bin/assemble`):
   - Installs production dependencies (`npm ci --only=production`)
   - Builds the application (`npm run build`)
   - Fixes file permissions

2. **Run Phase** (`.s2i/bin/run`):
   - Starts the application using `npm start`
   - Serves the built files from the `dist` directory on port 8080

## Environment Variables

The following environment variables are configured in `.s2i/environment`:

- `NODE_VERSION=18` - Node.js version to use
- `NPM_CONFIG_LOGLEVEL=info` - npm logging level
- `NODE_ENV=production` - Node environment
- `OUTPUT_DIR=dist` - Build output directory
- `PORT=8080` - Application port

## Application Configuration

### Port Configuration

The application listens on port 8080 by default, which is the standard port for OpenShift applications.

### Health Checks

You can configure health checks in OpenShift:

```bash
# Add readiness probe
oc set probe dc/green-datacenter-selector --readiness --get-url=http://:8080/

# Add liveness probe
oc set probe dc/green-datacenter-selector --liveness --get-url=http://:8080/
```

## Scaling

Scale your application:

```bash
# Scale to 3 replicas
oc scale dc/green-datacenter-selector --replicas=3

# Enable autoscaling
oc autoscale dc/green-datacenter-selector --min=2 --max=5 --cpu-percent=80
```

## Monitoring

View logs:

```bash
# View build logs
oc logs -f bc/green-datacenter-selector

# View application logs
oc logs -f dc/green-datacenter-selector
```

## Troubleshooting

### Build Fails

1. Check build logs: `oc logs -f bc/green-datacenter-selector`
2. Verify Node.js version compatibility
3. Ensure all dependencies are in `package.json`

### Application Won't Start

1. Check application logs: `oc logs -f dc/green-datacenter-selector`
2. Verify port 8080 is correctly configured
3. Check that the `dist` directory was created during build

### Font Loading Issues

The warnings about IBM Plex fonts during build are normal and won't affect the application. The fonts will be loaded at runtime from the Carbon Design System.

## Additional Resources

- [OpenShift Documentation](https://docs.openshift.com/)
- [Source-to-Image (S2I)](https://docs.openshift.com/container-platform/latest/openshift_images/using_images/using-s21-images.html)
- [Node.js on OpenShift](https://docs.openshift.com/container-platform/latest/openshift_images/using_images/using-nodejs.html)