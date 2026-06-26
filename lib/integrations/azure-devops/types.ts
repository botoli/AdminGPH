export interface AzureDevOpsConfig {
  orgUrl: string;
  project: string;
  personalAccessToken: string;
}

export interface AzureWorkItem {
  id: number;
  title: string;
  type: string;
  state: string;
  effort?: number;
  assignedTo?: string;
}

export interface AzureDevOpsAdapter {
  fetchWorkItems(): Promise<AzureWorkItem[]>;
  syncTask(workItem: AzureWorkItem): Promise<void>;
}

// Future implementation:
// - Implement AzureDevOpsRestAdapter using Azure DevOps REST API
// - Map work items to local Task model
// - Sync status, effort (plannedHours), and metadata
