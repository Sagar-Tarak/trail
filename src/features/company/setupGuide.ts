export interface GuideField {
  name: string;
  requirement: string;
  explanation: string;
  example?: string;
}
export interface GuideStep {
  title: string;
  summary: string;
  owner: string;
  fields: GuideField[];
  instructions: string[];
  outcome: string;
  action: { label: string; to: string };
}

export const setupGuide: GuideStep[] = [
  {
    title: "Register your company",
    summary:
      "Create your company workspace and its first administrator account.",
    owner: "Company owner or the person responsible for the audit trail",
    fields: [
      {
        name: "Your name",
        requirement: "Required",
        explanation:
          "The name of the person creating the administrator account.",
        example: "Asha Patel",
      },
      {
        name: "Username",
        requirement: "Required",
        explanation:
          "Your sign-in username. You can also sign in with your work email.",
        example: "asha.patel",
      },
      {
        name: "Company name",
        requirement: "Required",
        explanation: "The company whose activity you want to follow.",
        example: "Acme Logistics",
      },
      {
        name: "Company slug",
        requirement: "Required",
        explanation:
          "A company identifier. We suggest one from your company name; you can edit it using lowercase letters, numbers and dashes.",
        example: "acme-logistics",
      },
      {
        name: "Industry",
        requirement: "Required",
        explanation:
          "Choose your company's industry from the available options.",
        example: "Logistics",
      },
      {
        name: "Work email",
        requirement: "Required",
        explanation:
          "A valid email address, up to 100 characters, for your administrator account.",
        example: "asha@yourcompany.example",
      },
      {
        name: "Password and confirmation",
        requirement: "Required",
        explanation:
          "Choose a password between 8 and 200 characters and enter the same password again to confirm it.",
      },
    ],
    instructions: [
      "Open Create a workspace and enter your company and administrator details.",
      "Review the suggested company slug, choose your industry, and confirm your password.",
      "Select Create workspace. You will be signed in and taken to this setup guide for the next step.",
      "If your company already has a workspace, ask its administrator to create your team account, then sign in. Register a new workspace only for a new company.",
    ],
    outcome:
      "You can see your company name in the workspace. Registration creates your company account; the following steps connect the source of its activity.",
    action: { label: "Create a workspace", to: "/auth/sign-up" },
  },
  {
    title: "Prepare your database details",
    summary:
      "Ask your database administrator for the connection details and access needed to capture changes.",
    owner: "Your database administrator or hosting provider",
    fields: [
      {
        name: "PostgreSQL host",
        requirement: "Required",
        explanation:
          "A database address that the Trio Trail backend can reach. This is the database server address, not your company website.",
        example: "db.yourcompany.example",
      },
      {
        name: "Port",
        requirement: "Required",
        explanation:
          "The database connection port. Use the value supplied by your administrator; PostgreSQL commonly uses 5432.",
        example: "5432",
      },
      {
        name: "Database name",
        requirement: "Required",
        explanation:
          "The PostgreSQL database containing the records you want to track.",
        example: "company_operations",
      },
      {
        name: "Database username",
        requirement: "Required",
        explanation:
          "A database login with the permissions needed for replication, reading selected tables, and the setup operations. Your administrator may need to perform privileged setup steps.",
        example: "trio_trail_reader",
      },
      {
        name: "Database password",
        requirement: "Required for the full setup flow",
        explanation:
          "The password for that database login. Outbox installation and verification use the saved connection credentials. Enter it in the Database form.",
      },
      {
        name: "SSL setting",
        requirement: "Required",
        explanation:
          "Ask your hosting provider whether the connection requires SSL. The form starts with SSL enabled and validates the database certificate. A private CA requires trust configuration by your Trio Trail administrator.",
      },
      {
        name: "Tables to capture",
        requirement: "Optional selection",
        explanation:
          "After testing the connection, search and select the business tables to follow. You can also type schema.table names manually. Choose All supported tables explicitly to capture everything.",
        example: "public.orders, public.customers",
      },
    ],
    instructions: [
      "Ask your administrator to confirm PostgreSQL logical replication is enabled (wal_level = logical) and that replication slots and senders are available.",
      "Confirm the backend can reach the database host and port, including any firewall or hosting-provider access rules.",
      "Confirm the database login can read the selected tables and that someone with the necessary permissions can create the publication, replication slot and outbox objects.",
      "Keep the selected table names exactly as they appear in PostgreSQL, including the schema and letter case.",
    ],
    outcome:
      "You have the connection details and a database administrator has confirmed the required access. You are ready to test the connection.",
    action: { label: "Open database setup", to: "/software" },
  },
  {
    title: "Connect the company database",
    summary:
      "Test the supplied details, then configure capture for your selected tables.",
    owner: "Company administrator, with help from the database administrator",
    fields: [
      {
        name: "Connection details",
        requirement: "Required",
        explanation:
          "Enter the host, port, database name, database username, password and SSL setting collected in the previous step.",
      },
      {
        name: "Tables to capture",
        requirement: "Optional selection",
        explanation:
          "Test the connection to load selectable tables, then choose the tables agreed with your administrator. You can also enter schema-qualified names manually.",
        example: "public.orders, public.customers",
      },
    ],
    instructions: [
      "Open Database and fill in the Connect your database form.",
      "Select Test connection and review the result. If it fails, correct the details or ask your administrator to check access before continuing.",
      "Select Configure capture and review the confirmation. This sets up replication objects on the source database.",
      "Review the returned warnings and refresh Capture status. Continue to the outbox and attribution step when the database is configured.",
    ],
    outcome:
      "Capture status shows Database configured, and the connection and selected tables have been set up. Continue with attribution and verification.",
    action: { label: "Test and configure database", to: "/software" },
  },
  {
    title: "Set up who made each change",
    summary:
      "Install the attribution outbox and ask your application developer to connect the actor context.",
    owner: "Your application developer and database administrator",
    fields: [
      {
        name: "Application database roles",
        requirement: "Optional role grants",
        explanation:
          "The PostgreSQL roles used by your application or background workers to write business records. These are database login roles, not Trio Trail team roles. Enter multiple roles separated by commas.",
        example: "app_user, worker_user",
      },
      {
        name: "Application actor context",
        requirement: "Needed to identify users and services",
        explanation:
          "Your developer provides the signed-in user's external ID or a service/cron identity, with request and operation context where available. This is an application integration step.",
      },
    ],
    instructions: [
      "In Database, go to Install outbox and activate. Enter application database roles if your administrator wants the installer to grant them access.",
      "Select Install outbox. The installation creates the triotrail schema, outbox table and actor helper function on the connected database.",
      "Ask your developer to integrate the Trio Trail SDK or equivalent outbox attribution into the application that writes to this database.",
      "The actor context must be written in the same database transaction as the business change. Include service and scheduled-job identities for background work.",
    ],
    outcome:
      "The outbox is installed and your application developer has connected actor attribution. Installing the outbox alone does not tell Trio Trail which application user made a change.",
    action: { label: "Open SDK installation guide", to: "/sdk-guide" },
  },
  {
    title: "Verify and activate capture",
    summary:
      "Verify that the attribution objects are ready, then activate the capture stream.",
    owner: "Company administrator, with database administrator support",
    fields: [
      {
        name: "Configured connection",
        requirement: "From earlier steps",
        explanation:
          "The saved company database connection is reused for outbox verification and activation.",
      },
      {
        name: "Outbox installation",
        requirement: "Required",
        explanation:
          "The triotrail actor function and outbox table must be installed and the outbox must be included in the replication publication.",
      },
    ],
    instructions: [
      "Select Verify outbox on the Database page and read the result.",
      "If verification fails, ask your administrator to address the reported missing objects, publication membership or connection access, then verify again.",
      "After verification succeeds, select Activate capture.",
      "Refresh Capture status and review the session or slot status, activity, errors and processing metrics. A configured database alone does not confirm that capture is running successfully.",
    ],
    outcome:
      "Verification succeeds, activation succeeds, and the status does not show a capture error. You are ready to check a business change.",
    action: { label: "Verify and activate", to: "/software" },
  },
  {
    title: "Check your first company activity",
    summary:
      "Confirm that a business change appears with the correct time, actor and values.",
    owner: "Company administrator and an authorised application user",
    fields: [
      {
        name: "A known business change",
        requirement: "Required to check capture",
        explanation:
          "Use an authorised change in your source application after capture is active. Note its table, record ID, actor and approximate time.",
      },
      {
        name: "Date range and display time",
        requirement: "Choose in the timeline",
        explanation:
          "The timeline starts with the last seven calendar days in the workspace time zone. All date filters and displayed timestamps use the time zone selected in the top bar, such as Asia/Calcutta. Change it there before choosing the dates.",
      },
      {
        name: "Table and record ID",
        requirement: "For record history",
        explanation:
          "Use the schema-qualified table and the record identifier to follow one record's lifecycle.",
        example: "public.orders and ORD-1042",
      },
    ],
    instructions: [
      "Open Activity timeline after a known change has been made in a captured table. Set the date range to include the time of that change.",
      "Narrow the results by table, actor or description, then open See changes to compare the before and after values.",
      "Check the actor and timestamp against the source application. The detail view includes a copyable UTC timestamp.",
      "Open the related transaction to inspect associated changes. Use Records with a table and record ID to follow a specific record.",
    ],
    outcome:
      "You can find the expected change, identify who made it, and confirm when it happened and which values changed.",
    action: { label: "Open activity timeline", to: "/timeline" },
  },
  {
    title: "Add your team and keep monitoring",
    summary:
      "Create accounts for colleagues and use the workspace for daily investigations.",
    owner: "Company administrator",
    fields: [
      {
        name: "Team member details",
        requirement: "Required for each account",
        explanation:
          "Provide the person's name, username, email, role, initial password and matching password confirmation.",
      },
      {
        name: "Team role",
        requirement: "Required",
        explanation:
          "Choose the appropriate available role: Admin, Manager, Member or Guest.",
      },
    ],
    instructions: [
      "Open Team & account and complete Create team member. The current flow creates an account with an initial password; it does not send an invitation email.",
      "Provide the colleague with their sign-in details through your normal secure handover process, then ask them to sign in to the existing company workspace.",
      "Use Dashboard for activity totals, Activity timeline for time-based investigations, Transactions for related changes, Records for record history, and Errors for error or critical events.",
      "Return to Database to check capture health. In Team & account, review your sessions or sign out all devices when needed.",
    ],
    outcome:
      "Your company and team can sign in, monitor capture health and investigate the audit trail.",
    action: { label: "Create a team member", to: "/users" },
  },
];
