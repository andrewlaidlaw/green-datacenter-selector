# OpenShift Deployment with Security Hardening

This directory contains OpenShift deployment configurations with security best practices implemented.

## Security Features Implemented

### 1. Container Security Context
- **runAsNonRoot**: Ensures container doesn't run as root user
- **allowPrivilegeEscalation**: Disabled to prevent privilege escalation
- **capabilities**: All capabilities dropped for minimal permissions
- **seccompProfile**: Uses RuntimeDefault for syscall filtering
- **readOnlyRootFilesystem**: Set to false only for nginx logs (minimal write access)

### 2. Pod Security Context
- **runAsNonRoot**: Pod-level enforcement
- **seccompProfile**: RuntimeDefault for additional security

### 3. Resource Limits
- Memory: 128Mi request, 256Mi limit
- CPU: 100m request, 500m limit
- Prevents resource exhaustion attacks

### 4. Health Checks
- **Liveness Probe**: Ensures container is running
- **Readiness Probe**: Ensures container is ready to serve traffic
- Both use the `/health` endpoint from nginx.conf

### 5. Network Security
- **TLS Termination**: Edge termination at Route level
- **Insecure Traffic**: Automatically redirected to HTTPS
- **Service Type**: ClusterIP (internal only, exposed via Route)

## Deployment Instructions

### Prerequisites
- OpenShift CLI (`oc`) installed
- Access to an OpenShift cluster
- Logged in to OpenShift: `oc login`

### Quick Deploy

```bash
# Create a new project
oc new-project green-datacenter-selector

# Apply all configurations
oc apply -f openshift/

# Start the build
oc start-build green-datacenter-selector

# Monitor the build
oc logs -f bc/green-datacenter-selector

# Check deployment status
oc get pods
oc get route
```

### Step-by-Step Deploy

```bash
# 1. Create ImageStream
oc apply -f openshift/imagestream.yaml

# 2. Create BuildConfig
oc apply -f openshift/buildconfig.yaml

# 3. Start the build
oc start-build green-datacenter-selector

# 4. Wait for build to complete
oc get builds

# 5. Deploy the application
oc apply -f openshift/deployment.yaml

# 6. Create the service
oc apply -f openshift/service.yaml

# 7. Create the route
oc apply -f openshift/route.yaml

# 8. Get the application URL
oc get route green-datacenter-selector -o jsonpath='{.spec.host}'
```

## Verification

### Check Security Context
```bash
# View pod security context
oc get pod -l app=green-datacenter-selector -o yaml | grep -A 10 securityContext

# Verify non-root user
oc exec -it deployment/green-datacenter-selector -- id
```

### Check Health Endpoints
```bash
# Get route URL
ROUTE=$(oc get route green-datacenter-selector -o jsonpath='{.spec.host}')

# Test health endpoint
curl https://$ROUTE/health
```

### Check Security Headers
```bash
# Test security headers
curl -I https://$ROUTE

# Should see:
# - X-Frame-Options: SAMEORIGIN
# - X-Content-Type-Options: nosniff
# - X-XSS-Protection: 1; mode=block
# - Content-Security-Policy: ...
# - Referrer-Policy: strict-origin-when-cross-origin
# - Permissions-Policy: ...
```

## Scaling

```bash
# Scale to 3 replicas
oc scale deployment/green-datacenter-selector --replicas=3

# Enable autoscaling (2-5 replicas, 80% CPU threshold)
oc autoscale deployment/green-datacenter-selector --min=2 --max=5 --cpu-percent=80
```

## Monitoring

```bash
# View logs
oc logs -f deployment/green-datacenter-selector

# View events
oc get events --sort-by='.lastTimestamp'

# Check resource usage
oc adm top pods -l app=green-datacenter-selector
```

## Troubleshooting

### Build Fails
```bash
# Check build logs
oc logs -f bc/green-datacenter-selector

# Describe build
oc describe build green-datacenter-selector-1
```

### Pod Won't Start
```bash
# Check pod status
oc get pods -l app=green-datacenter-selector

# Describe pod
oc describe pod -l app=green-datacenter-selector

# Check events
oc get events --field-selector involvedObject.name=<pod-name>
```

### Security Context Issues
If you encounter permission errors:
```bash
# Check if SCC (Security Context Constraints) allows the configuration
oc get scc

# The default 'restricted' SCC should work with these settings
# If needed, you can check which SCC is being used:
oc describe pod -l app=green-datacenter-selector | grep scc
```

## Security Compliance

This deployment follows:
- ✅ OpenShift Security Best Practices
- ✅ OWASP Security Guidelines
- ✅ CIS Kubernetes Benchmark recommendations
- ✅ Principle of Least Privilege
- ✅ Defense in Depth strategy

## Files Overview

- `buildconfig.yaml` - S2I build configuration
- `imagestream.yaml` - Image stream for built images
- `deployment.yaml` - Deployment with security context
- `service.yaml` - ClusterIP service
- `route.yaml` - HTTPS route with TLS termination
- `README.md` - This file

## Additional Security Considerations

### Network Policies (Optional)
If your cluster uses NetworkPolicies, create one to restrict traffic:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: green-datacenter-selector
spec:
  podSelector:
    matchLabels:
      app: green-datacenter-selector
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          network.openshift.io/policy-group: ingress
    ports:
    - protocol: TCP
      port: 8080
```

### Secrets Management
If you need to add API keys or secrets in the future:

```bash
# Create a secret
oc create secret generic app-secrets --from-literal=API_KEY=your-key-here

# Reference in deployment.yaml:
# env:
# - name: API_KEY
#   valueFrom:
#     secretKeyRef:
#       name: app-secrets
#       key: API_KEY
```

## Support

For issues or questions:
- Check OpenShift documentation: https://docs.openshift.com/
- Review application logs: `oc logs -f deployment/green-datacenter-selector`
- Open an issue on GitHub