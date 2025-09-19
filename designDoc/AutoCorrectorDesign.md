# Requirements
- **Main Application Function**: Continuously generate new license agents
- **Multi-Instance Support**: Each license agent can run multiple instances
- **Instance Isolation**: Each running instance is independently deployed to different Vercel projects
- **Automatic Deployment**: When license agent code is modified, automatically deploy to all corresponding running instances

# Infrastructure Resource Plan

### GitHub Monorepo for license agents
```
rom-ai-monorepo/
├── agent-001/            # Agent 001 code
│   ├── src/              # Source code
│   ├── package.json      # Dependencies configuration
│   ├── vercel.json       # Vercel configuration
│   └── README.md         # Documentation
├── agent-002/            # Agent 002 code
└── ...
```

### GitHub Terraform Repository
```
rom-ai-terraform/
├── environments/              # Environment configurations
│   ├── dev/                  # Development environment
│   ├── staging/              # Staging environment
│   └── prod/                 # Production environment
├── modules/                  # Terraform modules
│   ├── vercel-project/       # Vercel project module
│   ├── github-webhook/       # GitHub Webhook module
│   └── monitoring/           # Monitoring module
├── main.tf                   # Main configuration file
├── variables.tf              # Variable definitions
├── outputs.tf                # Output definitions
└── terraform.tfvars          # Variable values
```

### Vercel Project Naming Convention
- **Format**: `rom-ai-{agent-id}-{instance-id}`
- **Example**: `rom-ai-agent001-instance001`


# Usage Flow

### Create New License Agent Flow
1. gen license agent code
2. use terraform to create a new vercel project and link to specified directory in monorepo
3. create a new directory in monorepo and place new code in it
4. push to github and deploy to vercel project automatically

### Run New Agent Instance Flow
1. use terraform to create a new vercel project and link to specified directory in monorepo
2. push to github and deploy to vercel project automatically
