# Deployment Guide

## Quick Start with Docker

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Steps

1. **Clone and configure**
   ```bash
   git clone <repo-url>
   cd windsurf-project-3
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start services**
   ```bash
   docker-compose up -d
   ```

3. **Initialize database**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

4. **Create admin user**
   ```bash
   docker-compose exec backend python scripts/create_admin.py
   ```

5. **Access application**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs
   - Caregiver Dashboard: http://localhost:3000/caregiver

## Production Deployment

### Environment Variables

Required for production:

```bash
# Security - MUST CHANGE
SECRET_KEY=<generate-strong-secret>
DATABASE_URL=postgresql://user:pass@db:5432/memorycare

# OpenAI - Required
OPENAI_API_KEY=<your-key>

# Notifications - Recommended
TWILIO_ACCOUNT_SID=<your-sid>
TWILIO_AUTH_TOKEN=<your-token>
TWILIO_PHONE_NUMBER=<your-number>

SMTP_USER=<email>
SMTP_PASSWORD=<password>

# Production Settings
ENABLE_VOICE_RECORDING=true
REQUIRE_EXPLICIT_CONSENT=true
LOG_RETENTION_DAYS=90
```

### Production Checklist

- [ ] Change all default passwords and secrets
- [ ] Configure SSL/TLS certificates
- [ ] Set up database backups
- [ ] Configure monitoring and alerting
- [ ] Enable audit logging
- [ ] Test disaster recovery procedures
- [ ] Obtain necessary consent forms
- [ ] Complete security audit
- [ ] Set up error tracking (Sentry)
- [ ] Configure CDN for static assets

### Scaling Recommendations

**Small Deployment (1-50 patients)**
- 2 vCPU, 4GB RAM for API server
- Standard PostgreSQL instance
- Single Redis instance

**Medium Deployment (50-500 patients)**
- 3x API servers behind load balancer
- PostgreSQL with read replicas
- Redis cluster
- Celery workers: 4-8

**Large Deployment (500+ patients)**
- Auto-scaling API servers
- PostgreSQL cluster with pgpool
- Redis Sentinel
- Celery workers: 10-20
- Dedicated monitoring infrastructure

## Cloud Providers

### AWS

```bash
# Use ECS for containers
# RDS for PostgreSQL
# ElastiCache for Redis
# SES for email
# SNS for SMS

terraform apply -var-file=aws.tfvars
```

### Azure

```bash
# Azure Container Instances
# Azure Database for PostgreSQL
# Azure Cache for Redis
# Azure Communication Services

az deployment group create \
  --resource-group memory-care \
  --template-file azure-deploy.json
```

### Google Cloud

```bash
# Cloud Run for containers
# Cloud SQL for PostgreSQL
# Memorystore for Redis
# SendGrid for email

gcloud run deploy memory-care \
  --image gcr.io/project/memory-care:latest
```

## Monitoring Setup

### Prometheus Metrics

```yaml
scrape_configs:
  - job_name: 'memory-care-api'
    static_configs:
      - targets: ['api:8000']
```

### Grafana Dashboards

Import dashboards:
- API Performance
- Patient Engagement Metrics
- Safety Alert Response Times
- System Health

### Alerts

Configure alerts for:
- High error rate (>5%)
- Slow response times (>2s p95)
- Database connection failures
- Unacknowledged critical alerts (>5 min)

## Backup and Recovery

### Automated Backups

```bash
# Daily PostgreSQL backups
0 2 * * * pg_dump memorycare | gzip > backup_$(date +%Y%m%d).sql.gz

# Weekly full system backup
0 3 * * 0 tar -czf /backups/full_$(date +%Y%m%d).tar.gz /app
```

### Restore Procedure

```bash
# Restore database
gunzip < backup.sql.gz | psql memorycare

# Verify data integrity
docker-compose exec backend python scripts/verify_data.py
```

## Security Hardening

### Firewall Rules

```bash
# Allow only necessary ports
ufw allow 443/tcp  # HTTPS
ufw allow 22/tcp   # SSH (from specific IPs only)
ufw enable
```

### SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
}
```

### Rate Limiting

```python
# In FastAPI middleware
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/endpoint")
@limiter.limit("10/minute")
async def endpoint():
    pass
```

## Health Checks

### API Health Endpoint

```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Automated Monitoring

```bash
# Set up cron job for health checks
*/5 * * * * curl -f http://localhost:8000/api/health || systemctl restart memory-care
```

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check database status
docker-compose ps postgres
docker-compose logs postgres

# Reset connections
docker-compose restart postgres
```

**High Memory Usage**
```bash
# Check memory by service
docker stats

# Restart specific service
docker-compose restart backend
```

**Slow API Responses**
```bash
# Check slow queries
docker-compose exec postgres psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

## Maintenance

### Regular Tasks

**Daily:**
- Review critical alerts
- Check backup completion
- Monitor error logs

**Weekly:**
- Review system metrics
- Update dependencies (security patches)
- Test disaster recovery

**Monthly:**
- Full security audit
- Performance optimization
- Capacity planning review

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild containers
docker-compose build

# Apply database migrations
docker-compose exec backend alembic upgrade head

# Restart services
docker-compose up -d
```

## Compliance

### HIPAA Compliance

- [ ] Sign Business Associate Agreement with cloud provider
- [ ] Enable encryption at rest for all databases
- [ ] Configure audit logging
- [ ] Implement access controls
- [ ] Set up breach notification procedures

### Data Retention

```python
# Automated cleanup (run via cron)
# Delete conversations older than retention period
DELETE FROM conversations 
WHERE created_at < NOW() - INTERVAL '90 days'
AND patient_consent_expires < NOW();
```

## Support

### Log Collection

```bash
# Collect logs for support
docker-compose logs --tail=1000 > logs.txt
tar -czf support-bundle.tar.gz logs.txt docker-compose.yml .env.example
```

### Performance Profiling

```bash
# Enable profiling
docker-compose exec backend python -m cProfile -o profile.stats app/main.py

# Analyze results
python -m pstats profile.stats
```
