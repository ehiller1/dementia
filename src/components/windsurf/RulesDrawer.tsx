/**
 * Rules Drawer
 * 
 * Windsurf-style user rules management
 * View, create, edit, and toggle activation of rules
 */

import React, { useState, useEffect } from 'react';
import { UserRule, RuleActivation, RuleCategory, RuleScope } from '@/services/conversation/UserRulesService';
import { X, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, Filter } from 'lucide-react';

interface RulesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  tenantId: string;
}

export const RulesDrawer: React.FC<RulesDrawerProps> = ({
  isOpen,
  onClose,
  userId,
  tenantId
}) => {
  const [rules, setRules] = useState<UserRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<RuleCategory | 'all'>('all');
  const [filterActivation, setFilterActivation] = useState<RuleActivation | 'all'>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<UserRule | null>(null);

  // Form state for creating/editing
  const [formData, setFormData] = useState({
    name: '',
    body_md: '',
    description: '',
    scope: 'global' as RuleScope,
    pattern: '',
    activation: 'model-decides' as RuleActivation,
    category: 'guidance' as RuleCategory,
    priority: 100,
    tags: [] as string[]
  });

  useEffect(() => {
    if (isOpen) {
      loadRules();
    }
  }, [isOpen, userId, tenantId]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/windsurf/rules?userId=${userId}&tenantId=${tenantId}`);
      const data = await response.json();
      if (data.success) {
        setRules(data.rules);
      }
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/windsurf/rules/${ruleId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentState })
      });
      
      if (response.ok) {
        await loadRules();
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      const response = await fetch(`/api/windsurf/rules/${ruleId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadRules();
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleSaveRule = async () => {
    try {
      const url = editingRule
        ? `/api/windsurf/rules/${editingRule.id}`
        : '/api/windsurf/rules';
      
      const method = editingRule ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          user_id: userId,
          tenant_id: tenantId
        })
      });
      
      if (response.ok) {
        await loadRules();
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      body_md: '',
      description: '',
      scope: 'global',
      pattern: '',
      activation: 'model-decides',
      category: 'guidance',
      priority: 100,
      tags: []
    });
    setIsCreating(false);
    setEditingRule(null);
  };

  const startEdit = (rule: UserRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      body_md: rule.body_md,
      description: rule.description || '',
      scope: rule.scope,
      pattern: rule.pattern || '',
      activation: rule.activation,
      category: rule.category,
      priority: rule.priority,
      tags: rule.tags
    });
    setIsCreating(true);
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = searchQuery === '' ||
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.body_md.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || rule.category === filterCategory;
    const matchesActivation = filterActivation === 'all' || rule.activation === filterActivation;
    
    return matchesSearch && matchesCategory && matchesActivation;
  });

  const getCategoryColor = (category: RuleCategory) => {
    const colors: Record<RuleCategory, string> = {
      'business-logic': 'bg-blue-500/20 text-blue-400',
      'preferences': 'bg-purple-500/20 text-purple-400',
      'constraints': 'bg-orange-500/20 text-orange-400',
      'guidance': 'bg-green-500/20 text-green-400',
      'style': 'bg-pink-500/20 text-pink-400'
    };
    return colors[category] || 'bg-slate-500/20 text-slate-400';
  };

  const getActivationBadge = (activation: RuleActivation) => {
    const badges: Record<RuleActivation, { label: string; color: string }> = {
      'always': { label: 'Always', color: 'bg-green-500/20 text-green-400' },
      'model-decides': { label: 'Model Decides', color: 'bg-blue-500/20 text-blue-400' },
      'manual': { label: 'Manual', color: 'bg-slate-500/20 text-slate-400' }
    };
    return badges[activation];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-2xl bg-slate-900 border-l border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-200">User Rules</h2>
            <p className="text-xs text-slate-400 mt-1">
              Define custom guidance for AI behavior
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        {!isCreating && (
          <div className="p-4 border-b border-slate-700 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rules..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter dropdowns */}
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as RuleCategory | 'all')}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="business-logic">Business Logic</option>
                <option value="preferences">Preferences</option>
                <option value="constraints">Constraints</option>
                <option value="guidance">Guidance</option>
                <option value="style">Style</option>
              </select>

              <select
                value={filterActivation}
                onChange={(e) => setFilterActivation(e.target.value as RuleActivation | 'all')}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Modes</option>
                <option value="always">Always</option>
                <option value="model-decides">Model Decides</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div className="text-xs text-slate-400">
              Showing {filteredRules.length} of {rules.length} rules
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isCreating ? (
            /* Create/Edit Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Prefer Price Incentives for Premium"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rule Body (Markdown) *
                </label>
                <textarea
                  value={formData.body_md}
                  onChange={(e) => setFormData({ ...formData, body_md: e.target.value })}
                  placeholder="**Your guidance here**&#10;&#10;Provide clear, actionable guidance for the AI..."
                  rows={8}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this rule"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Scope
                  </label>
                  <select
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value as RuleScope })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="global">Global</option>
                    <option value="workspace">Workspace</option>
                    <option value="pattern">Pattern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Activation
                  </label>
                  <select
                    value={formData.activation}
                    onChange={(e) => setFormData({ ...formData, activation: e.target.value as RuleActivation })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="always">Always</option>
                    <option value="model-decides">Model Decides</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              </div>

              {formData.scope === 'pattern' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Pattern (glob-style)
                  </label>
                  <input
                    type="text"
                    value={formData.pattern}
                    onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                    placeholder="e.g., pricing.*, marketing.campaigns.*"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as RuleCategory })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="business-logic">Business Logic</option>
                    <option value="preferences">Preferences</option>
                    <option value="constraints">Constraints</option>
                    <option value="guidance">Guidance</option>
                    <option value="style">Style</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Priority (1-1000)
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    min="1"
                    max="1000"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveRule}
                  disabled={!formData.name || !formData.body_md}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded font-medium transition-colors"
                >
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Rules List */
            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-slate-400 py-8">Loading rules...</div>
              ) : filteredRules.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  No rules found. Create your first rule to get started.
                </div>
              ) : (
                filteredRules.map(rule => (
                  <div
                    key={rule.id}
                    className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-200">{rule.name}</h4>
                          <span className={`px-2 py-0.5 text-xs rounded ${getCategoryColor(rule.category)}`}>
                            {rule.category}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded ${getActivationBadge(rule.activation).color}`}>
                            {getActivationBadge(rule.activation).label}
                          </span>
                        </div>
                        {rule.description && (
                          <p className="text-sm text-slate-400">{rule.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleRule(rule.id, rule.is_active)}
                          className="p-1 text-slate-400 hover:text-slate-200"
                          title={rule.is_active ? 'Disable rule' : 'Enable rule'}
                        >
                          {rule.is_active ? (
                            <ToggleRight className="w-5 h-5 text-green-400" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => startEdit(rule)}
                          className="p-1 text-slate-400 hover:text-blue-400"
                          title="Edit rule"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 text-slate-400 hover:text-red-400"
                          title="Delete rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-slate-900/50 rounded text-sm text-slate-300 font-mono whitespace-pre-wrap">
                      {rule.body_md.slice(0, 200)}{rule.body_md.length > 200 ? '...' : ''}
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                      <span>Priority: {rule.priority}</span>
                      <span>Used: {rule.times_activated} times</span>
                      {rule.pattern && <span>Pattern: {rule.pattern}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isCreating && (
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Rule</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
