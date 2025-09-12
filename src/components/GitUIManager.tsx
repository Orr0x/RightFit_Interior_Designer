import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserTier, getUserTierPermissions } from '@/types/user-tiers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  Upload, 
  Download,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Crown
} from 'lucide-react';

interface Branch {
  name: string;
  current: boolean;
  ahead: number;
  behind: number;
  lastCommit: string;
  lastCommitTime: string;
}

interface GitStatus {
  currentBranch: string;
  staged: string[];
  modified: string[];
  untracked: string[];
  ahead: number;
  behind: number;
}

interface CommitTemplate {
  type: string;
  label: string;
  description: string;
  example: string;
}

const GitUIManager: React.FC = () => {
  const { user } = useAuth();
  const userTier = (user?.profile?.user_tier as UserTier) || UserTier.FREE;
  const permissions = getUserTierPermissions(userTier);

  // Mock data - in real implementation, this would come from Git API
  const [gitStatus, setGitStatus] = useState<GitStatus>({
    currentBranch: 'feature/tier-account-access',
    staged: [],
    modified: ['src/components/GitUIManager.tsx', 'src/types/user-tiers.ts'],
    untracked: ['src/pages/GitManager.tsx'],
    ahead: 1,
    behind: 0
  });

  const [branches] = useState<Branch[]>([
    {
      name: 'main',
      current: false,
      ahead: 0,
      behind: 1,
      lastCommit: 'feat: Add CICD Baby to footer',
      lastCommitTime: '2 hours ago'
    },
    {
      name: 'develop',
      current: false,
      ahead: 0,
      behind: 1,
      lastCommit: 'feat: Set up branching strategy',
      lastCommitTime: '3 hours ago'
    },
    {
      name: 'feature/tier-account-access',
      current: true,
      ahead: 1,
      behind: 0,
      lastCommit: 'feat: Complete user tier access system',
      lastCommitTime: 'now'
    }
  ]);

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [commitType, setCommitType] = useState('feat');
  const [isLoading, setIsLoading] = useState(false);

  const commitTemplates: CommitTemplate[] = [
    {
      type: 'feat',
      label: '✨ Feature',
      description: 'A new feature',
      example: 'feat: Add user authentication'
    },
    {
      type: 'fix',
      label: '🐛 Bug Fix',
      description: 'A bug fix',
      example: 'fix: Resolve login validation error'
    },
    {
      type: 'docs',
      label: '📚 Documentation',
      description: 'Documentation changes',
      example: 'docs: Update README with setup instructions'
    },
    {
      type: 'style',
      label: '💄 Style',
      description: 'Code style changes',
      example: 'style: Format code with prettier'
    },
    {
      type: 'refactor',
      label: '♻️ Refactor',
      description: 'Code refactoring',
      example: 'refactor: Simplify authentication logic'
    },
    {
      type: 'test',
      label: '🧪 Test',
      description: 'Adding or updating tests',
      example: 'test: Add unit tests for user service'
    }
  ];

  const handleFileToggle = (file: string) => {
    setSelectedFiles(prev => 
      prev.includes(file) 
        ? prev.filter(f => f !== file)
        : [...prev, file]
    );
  };

  const handleStageFiles = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setGitStatus(prev => ({
        ...prev,
        staged: [...prev.staged, ...selectedFiles],
        modified: prev.modified.filter(f => !selectedFiles.includes(f)),
        untracked: prev.untracked.filter(f => !selectedFiles.includes(f))
      }));
      setSelectedFiles([]);
      setIsLoading(false);
    }, 1000);
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setGitStatus(prev => ({
        ...prev,
        staged: [],
        ahead: prev.ahead + 1
      }));
      setCommitMessage('');
      setIsLoading(false);
    }, 1500);
  };

  const handlePush = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setGitStatus(prev => ({
        ...prev,
        ahead: 0
      }));
      setIsLoading(false);
    }, 2000);
  };

  const getBranchColor = (branch: Branch) => {
    if (branch.current) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (branch.name === 'main') return 'bg-green-100 text-green-800 border-green-300';
    if (branch.name === 'develop') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'loading': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!permissions.canAccessGitUI) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Crown className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <CardTitle>Git UI Manager</CardTitle>
            <CardDescription>Developer access required</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              This tool requires DEV tier access or higher.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GitBranch className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Git UI Manager</h1>
              <p className="text-gray-600">Visual Git workflow management</p>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            {gitStatus.currentBranch}
          </Badge>
        </div>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5" />
              <span>Repository Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{gitStatus.staged.length}</div>
                <div className="text-sm text-gray-600">Staged</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{gitStatus.modified.length}</div>
                <div className="text-sm text-gray-600">Modified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{gitStatus.ahead}</div>
                <div className="text-sm text-gray-600">Ahead</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{gitStatus.behind}</div>
                <div className="text-sm text-gray-600">Behind</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="changes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="changes">Changes</TabsTrigger>
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="commit">Commit</TabsTrigger>
            <TabsTrigger value="deploy">Deploy</TabsTrigger>
          </TabsList>

          {/* Changes Tab */}
          <TabsContent value="changes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Working Directory Changes</CardTitle>
                <CardDescription>
                  Select files to stage for commit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Staged Files */}
                {gitStatus.staged.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">Staged Changes</h4>
                    {gitStatus.staged.map(file => (
                      <div key={file} className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-mono">{file}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Modified Files */}
                {gitStatus.modified.length > 0 && (
                  <div>
                    <h4 className="font-medium text-orange-700 mb-2">Modified Files</h4>
                    {gitStatus.modified.map(file => (
                      <div key={file} className="flex items-center space-x-2 p-2 bg-orange-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file)}
                          onChange={() => handleFileToggle(file)}
                          className="rounded"
                        />
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-mono">{file}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Untracked Files */}
                {gitStatus.untracked.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">Untracked Files</h4>
                    {gitStatus.untracked.map(file => (
                      <div key={file} className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file)}
                          onChange={() => handleFileToggle(file)}
                          className="rounded"
                        />
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-mono">{file}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedFiles.length > 0 && (
                  <Button 
                    onClick={handleStageFiles}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Staging...' : `Stage ${selectedFiles.length} file(s)`}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branches Tab */}
          <TabsContent value="branches" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Branch Management</CardTitle>
                <CardDescription>
                  Switch between branches and view branch status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {branches.map(branch => (
                  <div key={branch.name} className={`p-4 rounded-lg border ${getBranchColor(branch)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <GitBranch className="h-4 w-4" />
                        <span className="font-medium">{branch.name}</span>
                        {branch.current && <Badge variant="secondary">Current</Badge>}
                      </div>
                      <div className="flex items-center space-x-2">
                        {branch.ahead > 0 && (
                          <Badge variant="outline" className="text-green-600">
                            +{branch.ahead}
                          </Badge>
                        )}
                        {branch.behind > 0 && (
                          <Badge variant="outline" className="text-red-600">
                            -{branch.behind}
                          </Badge>
                        )}
                        {!branch.current && (
                          <Button size="sm" variant="outline">
                            Switch
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div>{branch.lastCommit}</div>
                      <div className="text-xs">{branch.lastCommitTime}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commit Tab */}
          <TabsContent value="commit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Commit</CardTitle>
                <CardDescription>
                  Commit staged changes with a descriptive message
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="commit-type">Commit Type</Label>
                  <Select value={commitType} onValueChange={setCommitType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {commitTemplates.map(template => (
                        <SelectItem key={template.type} value={template.type}>
                          {template.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {commitTemplates.find(t => t.type === commitType)?.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commit-message">Commit Message</Label>
                  <Input
                    id="commit-message"
                    placeholder={commitTemplates.find(t => t.type === commitType)?.example}
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={handleCommit}
                    disabled={!commitMessage.trim() || gitStatus.staged.length === 0 || isLoading}
                    className="flex-1"
                  >
                    <GitCommit className="h-4 w-4 mr-2" />
                    {isLoading ? 'Committing...' : 'Commit'}
                  </Button>
                  <Button 
                    onClick={handlePush}
                    disabled={gitStatus.ahead === 0 || isLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isLoading ? 'Pushing...' : `Push (${gitStatus.ahead})`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deploy Tab */}
          <TabsContent value="deploy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deployment Status</CardTitle>
                <CardDescription>
                  Monitor GitHub Actions and deployment status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon('success')}
                    <span className="font-medium text-green-800">Last deployment successful</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Deployed to production 2 hours ago
                  </p>
                </div>

                <Button className="w-full" variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Trigger Manual Deployment
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GitUIManager;
