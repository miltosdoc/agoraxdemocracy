# Security Audit Checklist

## Authentication & Authorization

- [ ] **Password Hashing**: bcrypt with cost factor ≥ 12
- [ ] **Session Management**: Secure, HttpOnly, SameSite cookies
- [ ] **Token Rotation**: JWT refresh token rotation
- [ ] **Rate Limiting**: Login attempts limited to 5/min
- [ ] **Account Lockout**: After 5 failed attempts, lock for 15 minutes
- [ ] **Password Policy**: Minimum 12 characters, complexity requirements

## Input Validation

- [ ] **SQL Injection**: Parameterized queries (Drizzle ORM)
- [ ] **XSS Prevention**: Content-Security-Policy headers
- [ ] **CSRF Protection**: Anti-CSRF tokens for state-changing operations
- [ ] **Input Sanitization**: All user input validated and sanitized
- [ ] **File Upload Validation**: Type, size, and content validation

## Data Protection

- [ ] **Encryption at Rest**: PostgreSQL TDE or filesystem encryption
- [ ] **Encryption in Transit**: TLS 1.3 with strong cipher suites
- [ ] **PII Handling**: Personal data encrypted and access-controlled
- [ ] **Audit Logging**: All data access logged with user ID and timestamp
- [ ] **Data Retention**: Automatic deletion after retention period

## API Security

- [ ] **Authentication**: All endpoints require authentication
- [ ] **Authorization**: Role-based access control (RBAC)
- [ ] **Rate Limiting**: API endpoints rate-limited
- [ ] **CORS**: Strict CORS policy with allowed origins
- [ ] **Input Validation**: Request body validation with Zod schemas

## Infrastructure Security

- [ ] **Container Security**: Non-root user, minimal base image
- [ ] **Secrets Management**: Environment variables, not hardcoded
- [ ] **Dependency Scanning**: Regular npm audit and dependency updates
- [ ] **Vulnerability Scanning**: Regular container image scanning
- [ ] **Network Security**: Firewall rules, security groups

## Cryptographic Security

- [ ] **Random Number Generation**: CSPRNG (crypto.getRandomValues)
- [ ] **Hash Functions**: SHA-256 for data integrity
- [ ] **Key Management**: Secure key storage and rotation
- [ ] **Certificate Management**: Valid TLS certificates with auto-renewal
- [ ] **Algorithm Selection**: Approved cryptographic algorithms only

## Sortition Security

- [ ] **Cryptographic Randomness**: CSPRNG-backed Fisher-Yates shuffle
- [ ] **Modulo Bias Elimination**: Rejection sampling implementation
- [ ] **Audit Trail**: Cryptographic seed recording for verification
- [ ] **Anti-Sybil Measures**: 7-day membership minimum, active panel exclusion
- [ ] **Statistical Uniformity**: Distribution testing for randomness

## Compliance

- [ ] **GDPR**: Data protection, right to be forgotten, consent management
- [ ] **Accessibility**: WCAG 2.1 AA compliance
- [ ] **Audit Trail**: Complete audit log of all actions
- [ ] **Incident Response**: Security incident response plan
- [ ] **Penetration Testing**: Regular third-party security assessments

## Monitoring & Alerting

- [ ] **Error Monitoring**: Sentry or similar error tracking
- [ ] **Performance Monitoring**: APM with latency tracking
- [ ] **Security Monitoring**: Intrusion detection, anomaly detection
- [ ] **Log Aggregation**: Centralized logging with retention policy
- [ ] **Alerting**: Real-time alerts for security events

## Testing

- [ ] **Unit Tests**: 90%+ code coverage
- [ ] **Integration Tests**: API endpoint testing
- [ ] **E2E Tests**: Critical user flows tested
- [ ] **Security Tests**: OWASP ZAP or similar scanning
- [ ] **Load Tests**: Performance under expected load

## Documentation

- [ ] **Security Policy**: Documented security policies and procedures
- [ ] **Incident Response**: Documented incident response plan
- [ ] **Architecture Diagrams**: Security-relevant architecture documented
- [ ] **API Documentation**: Security considerations documented
- [ ] **Threat Model**: Documented threat model and mitigations
