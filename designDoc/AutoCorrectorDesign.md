# requirement
- main app continuously generate license agents
- each license agent could have multiple running agents
- each running agent maps to 1 vercel project
- when the code of a license agent modified, deploy to all corresponding running agents (vercel projects)

# infra resourse
- 1 github monorepo for storing codes for license agents
- 1 github terraform repo for maintaining the infra for vercel
- multiple vercel projects

# use flow
- setup a monorepo (could set some limit and scale out when needed)
    - manage all code of license agents in the repo
    - each folder maps to one agent code
- when main app generate a newe license agent, do the following:
    - setup a vercel project linked to the monorepo and monitor the agent folder
    - create a new agent folder in the monorepo
    - update the project and deploy to the vercel project
- when an user run a new agent for an existed license agent, do the following:
    - setup a vercel project linked to the monorepo and monitor the agent folder
    - deploy to the vercel project

