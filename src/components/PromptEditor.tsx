import React, { useState, useEffect } from 'react';
import { promptService, Prompt } from '../services/PromptService';

interface PromptEditorProps {
  onClose?: () => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ onClose }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<Partial<Prompt>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState({ category: '', subcategory: '' });

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const allPrompts = await promptService.getAllPrompts();
      setPrompts(allPrompts);
    } catch (error) {
      console.error('Error loading prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setEditingPrompt({ ...prompt });
  };

  const handleSavePrompt = async () => {
    if (!editingPrompt.name || !editingPrompt.content) {
      alert('Name and content are required');
      return;
    }

    setSaving(true);
    try {
      if (selectedPrompt) {
        // Update existing prompt
        const success = await promptService.createPromptVersion(
          selectedPrompt.id,
          editingPrompt.content!,
          editingPrompt.variables || [],
          editingPrompt.metadata || {},
          'Manual edit via admin interface',
          'admin'
        );

        if (success) {
          await loadPrompts();
          alert('Prompt updated successfully!');
        } else {
          alert('Failed to update prompt');
        }
      } else {
        // Create new prompt
        const newPrompt = await promptService.upsertPrompt({
          name: editingPrompt.name!,
          category: editingPrompt.category || 'custom',
          subcategory: editingPrompt.subcategory,
          prompt_type: editingPrompt.prompt_type || 'template',
          content: editingPrompt.content!,
          variables: editingPrompt.variables || [],
          metadata: editingPrompt.metadata || {},
          version: 1,
          is_active: true
        });

        if (newPrompt) {
          await loadPrompts();
          setSelectedPrompt(newPrompt);
          alert('Prompt created successfully!');
        } else {
          alert('Failed to create prompt');
        }
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Error saving prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleNewPrompt = () => {
    setSelectedPrompt(null);
    setEditingPrompt({
      name: '',
      category: 'custom',
      prompt_type: 'template',
      content: '',
      variables: [],
      metadata: {},
      is_active: true
    });
  };

  const filteredPrompts = prompts.filter(prompt => {
    return (!filter.category || prompt.category === filter.category) &&
           (!filter.subcategory || prompt.subcategory === filter.subcategory);
  });

  const categories = [...new Set(prompts.map(p => p.category))];
  const subcategories = [...new Set(prompts.map(p => p.subcategory).filter(Boolean))];

  if (loading) {
    return <div className="p-4">Loading prompts...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Prompt Library</h2>
            <button
              onClick={handleNewPrompt}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              New Prompt
            </button>
          </div>
          
          {/* Filters */}
          <div className="space-y-2">
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <select
              value={filter.subcategory}
              onChange={(e) => setFilter({ ...filter, subcategory: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded text-sm"
            >
              <option value="">All Subcategories</option>
              {subcategories.map(subcat => (
                <option key={subcat} value={subcat}>{subcat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Prompt List */}
        <div className="p-2">
          {filteredPrompts.map(prompt => (
            <div
              key={prompt.id}
              onClick={() => handleSelectPrompt(prompt)}
              className={`p-3 mb-2 rounded cursor-pointer transition-colors ${
                selectedPrompt?.id === prompt.id
                  ? 'bg-blue-100 border-blue-300'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="font-medium text-sm">{prompt.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {prompt.category} {prompt.subcategory && `• ${prompt.subcategory}`}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                v{prompt.version} • {prompt.prompt_type}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {editingPrompt.name !== undefined ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {selectedPrompt ? 'Edit Prompt' : 'New Prompt'}
                </h3>
                <div className="space-x-2">
                  <button
                    onClick={handleSavePrompt}
                    disabled={saving}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={editingPrompt.name || ''}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="prompt_name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      value={editingPrompt.category || ''}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, category: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="narrative">Narrative</option>
                      <option value="agent">Agent</option>
                      <option value="intent">Intent</option>
                      <option value="template">Template</option>
                      <option value="molas">MOLAS</option>
                      <option value="system">System</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Subcategory</label>
                    <input
                      type="text"
                      value={editingPrompt.subcategory || ''}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, subcategory: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="continuation, initial, marketing, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                      value={editingPrompt.prompt_type || ''}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt_type: e.target.value as any })}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="system">System</option>
                      <option value="user">User</option>
                      <option value="template">Template</option>
                      <option value="completion">Completion</option>
                    </select>
                  </div>
                </div>

                {/* Variables */}
                <div>
                  <label className="block text-sm font-medium mb-1">Variables (comma-separated)</label>
                  <input
                    type="text"
                    value={(editingPrompt.variables || []).join(', ')}
                    onChange={(e) => setEditingPrompt({ 
                      ...editingPrompt, 
                      variables: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                    })}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="query, theme, agentType, context"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Variables that can be substituted in the prompt using {'{variable}'} syntax
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium mb-1">Prompt Content</label>
                  <textarea
                    value={editingPrompt.content || ''}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded font-mono text-sm"
                    rows={20}
                    placeholder="Enter your prompt content here..."
                  />
                </div>

                {/* Metadata */}
                <div>
                  <label className="block text-sm font-medium mb-1">Metadata (JSON)</label>
                  <textarea
                    value={JSON.stringify(editingPrompt.metadata || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const metadata = JSON.parse(e.target.value);
                        setEditingPrompt({ ...editingPrompt, metadata });
                      } catch (error) {
                        // Invalid JSON, keep the text but don't update metadata
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded font-mono text-sm"
                    rows={6}
                    placeholder='{"purpose": "Description of prompt usage"}'
                  />
                </div>

                {/* Preview */}
                {editingPrompt.variables && editingPrompt.variables.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Variable Preview</label>
                    <div className="p-3 bg-gray-50 rounded text-sm">
                      <div className="font-medium mb-2">Variables in this prompt:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {editingPrompt.variables.map(variable => (
                          <li key={variable} className="text-gray-700">
                            <code className="bg-gray-200 px-1 rounded">{`{${variable}}`}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a prompt to edit or create a new one
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptEditor;
