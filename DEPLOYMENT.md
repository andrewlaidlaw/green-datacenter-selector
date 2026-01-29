# OpenShift Deployment Guide

This guide explains how to deploy the Green Datacenter Selector application to OpenShift Container Platform.

## Prerequisites

- Access to an OpenShift cluster (OCP 4.x or later)
- `oc` CLI tool installed and configured
- Logged into your OpenShift cluster: `oc login`
- A project/namespace created: `oc new-project green-datacenter-selector`

## Deployment Options

### Option 1: Using OpenShift Build (Recommended)

This method uses OpenShift's Source-to-Image (S2I) build process to build the container image directly in the cluster.

#### Step 1: Create ImageStream
```bash
oc apply -f openshift/imagestream.yaml
```

#### Step 2: Create BuildConfig
```bash
oc apply -f openshift/buildconfig.yaml
```

#### Step 3: Start the Build
```bash
oc start-build green-datacenter-selector
```

Monitor the build:
```bash
oc logs -f bc/green-datacenter-selector
```

#### Step 4: Deploy the Application
```bash
oc apply -f openshift/deployment.yaml
oc apply -f openshift/service.yaml
oc apply -f openshift/route.yaml
```

#### Step 5: Get the Application URL
```bash
oc get route green-datacenter-selector
```

### Option 2: Using Pre-built Container Image

If you have a container registry with a pre-built image:

#### Step 1: Build and Push Image
```bash
# Build the image
docker build -t your-registry/green-datacenter-selector:latest .

# Push to registry
docker push your-registry/green-datacenter-selector:latest
```

#### Step 2: Update Deployment
Edit `openshift/deployment.yaml` and update the image reference:
```yaml
spec:
  containers:
  - name: green-datacenter-selector
    image: your-registry/green-datacenter-selector:latest
```

#### Step 3: Deploy
```bash
oc apply -f openshift/deployment.yaml
oc apply -f openshift/service.yaml
oc apply -f openshift/route.yaml
```

### Option 3: Quick Deploy with oc new-app

For rapid deployment directly from GitHub:

```bash
oc new-app https://github.com/andrewlaidlaw/green-datacenter-selector.git \
  --name=green-datacenter-selector \
  --strategy=docker

oc expose svc/green-datacenter-selector
```

## Verification

### Check Deployment Status
```bash
# Check pods
oc get pods

# Check deployment
oc get deployment green-datacenter-selector

# Check service
oc get svc green-datacenter-selector

# Check route
oc get route green-datacenter-selector
```

### View Logs
```bash
# Get pod name
POD_NAME=$(oc get pods -l app=green-datacenter-selector -o jsonpath='{.items[0].metadata.name}')

# View logs
oc logs $POD_NAME

# Follow logs
oc logs -f $POD_NAME
```

### Access the Application
```bash
# Get the route URL
ROUTE_URL=$(oc get route green-datacenter-selector -o jsonpath='{.spec.host}')
echo "Application URL: https://$ROUTE_URL"
```

## Configuration

### Environment Variables

If you need to add environment variables to the deployment:

```bash
oc set env deployment/green-datacenter-selector \
  API_URL=https://api.example.com \
  NODE_ENV=production
```

### Resource Limits

The deployment includes default resource limits:
- Memory: 128Mi (request) / 256Mi (limit)
- CPU: 100m (request) / 200m (limit)

To adjust these, edit `openshift/deployment.yaml` and reapply:
```bash
oc apply -f openshift/deployment.yaml
```

### Scaling

Scale the application horizontally:
```bash
# Scale to 3 replicas
oc scale deployment/green-datacenter-selector --replicas=3

# Auto-scale based on CPU
oc autoscale deployment/green-datacenter-selector \
  --min=2 --max=5 --cpu-percent=80
```

## Health Checks

The application includes health check endpoints:
- **Liveness Probe**: `/health` - Checks if the container is alive
- **Readiness Probe**: `/health` - Checks if the container is ready to serve traffic

## Security

The deployment includes security best practices:
- Runs as non-root user
- Drops all capabilities
- Uses seccomp profile
- TLS termination at the route level

## Troubleshooting

### Pod Not Starting
```bash
# Describe the pod
oc describe pod -l app=green-datacenter-selector

# Check events
oc get events --sort-by='.lastTimestamp'
```

### Build Failures
```bash
# Check build logs
oc logs -f bc/green-datacenter-selector

# Restart build
oc start-build green-datacenter-selector
```

### Application Errors
```bash
# Check application logs
oc logs -l app=green-datacenter-selector --tail=100

# Access pod shell
oc rsh deployment/green-datacenter-selector
```

### Route Not Accessible
```bash
# Check route configuration
oc describe route green-datacenter-selector

# Verify service endpoints
oc get endpoints green-datacenter-selector
```

## Updating the Application

### Update from Git (Option 1)
```bash
# Trigger a new build
oc start-build green-datacenter-selector

# Wait for build to complete
oc logs -f bc/green-datacenter-selector

# Deployment will automatically update with new image
```

### Manual Update (Option 2)
```bash
# Build new image
docker build -t your-registry/green-datacenter-selector:v2 .
docker push your-registry/green-datacenter-selector:v2

# Update deployment
oc set image deployment/green-datacenter-selector \
  green-datacenter-selector=your-registry/green-datacenter-selector:v2
```

## Cleanup

To remove the application:
```bash
# Delete all resources
oc delete -f openshift/

# Or delete the entire project
oc delete project green-datacenter-selector
```

## CI/CD Integration

### GitHub Webhook

To enable automatic builds on git push:

1. Get the webhook URL:
```bash
oc describe bc/green-datacenter-selector | grep -A 1 "Webhook GitHub"
```

2. Add the webhook URL to your GitHub repository:
   - Go to Settings → Webhooks → Add webhook
   - Paste the webhook URL
   - Set Content type to `application/json`
   - Select "Just the push event"

### GitOps with ArgoCD

For GitOps deployment, point ArgoCD to the `openshift/` directory in your repository.

## Additional Resources

- [OpenShift Documentation](https://docs.openshift.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Container Best Practices](https://docs.openshift.com/container-platform/latest/openshift_images/create-images.html)