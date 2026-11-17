import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
} from '@xyflow/react';
import { Plus, Users, CheckCircle2, Workflow } from 'lucide-react';
import type { FamilyMember, FamilyRelation } from './types';
import { storageService } from './services/storageService';
import { computeTreeLayout, reorganizeNodes } from './services/layoutService';
import { processFamilyContext } from './services/groqService';
import { FamilyCardNode } from './components/FamilyCardNode';
import { AddMemberDialog } from './components/AddMemberDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { Header } from './components/Header';
import './App.css';

const FamilyTreeFlow: React.FC = () => {
  const [members, setMembers] = useState<FamilyMember[]>(() => storageService.loadMembers());
  const [relations, setRelations] = useState<FamilyRelation[]>(() => storageService.loadRelations());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const { fitView } = useReactFlow();

  // Apply theme class to root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  const handleDeleteMember = useCallback((id: string) => {
    setMembers((prevMembers) => {
      const updatedMembers = prevMembers.filter((m) => m.id !== id);
      storageService.saveMembers(updatedMembers);
      return updatedMembers;
    });

    setRelations((prevRelations) => {
      const updatedRelations = prevRelations.filter((r) => r.source !== id && r.target !== id);
      storageService.saveRelations(updatedRelations);
      return updatedRelations;
    });

    showToast('Familiar removido da árvore.');
  }, []);

  // Compute React Flow nodes and edges with layout
  const { initialNodes, initialEdges } = useMemo(() => {
    const layout = computeTreeLayout(members, relations);
    const nodesWithHandler = layout.nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        onDelete: handleDeleteMember,
      },
    }));
    return { initialNodes: nodesWithHandler, initialEdges: layout.edges };
  }, [members, relations, handleDeleteMember]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when members or relations change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    if (initialNodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.25, duration: 400 }), 50);
    }
  }, [initialNodes, initialEdges, fitView, setNodes, setEdges]);

  // Node types registration
  const nodeTypes = useMemo(
    () => ({
      familyCard: FamilyCardNode,
    }),
    []
  );

  // Reorganizar de forma otimizada
  const handleReorganize = useCallback(() => {
    setNodes((currentNodes) => {
      return reorganizeNodes(currentNodes, relations);
    });

    setTimeout(() => {
      fitView({ padding: 0.25, duration: 600 });
    }, 60);

    showToast('Árvore reorganizada de forma otimizada!');
  }, [relations, fitView, setNodes]);

  const handleClearTree = () => {
    if (window.confirm('Deseja realmente limpar toda a árvore genealógica? Esta ação não pode ser desfeita.')) {
      storageService.clearAll();
      setMembers([]);
      setRelations([]);
      showToast('Árvore genealógica reiniciada.');
    }
  };

  const handleContextSubmit = async (contextText: string, customApiKey?: string) => {
    setIsLoading(true);
    try {
      const { graph, summary } = await processFamilyContext(
        contextText,
        members,
        relations,
        customApiKey
      );

      setMembers(graph.nodes);
      setRelations(graph.edges);

      storageService.saveMembers(graph.nodes);
      storageService.saveRelations(graph.edges);

      const history = storageService.loadHistory();
      storageService.saveHistory([...history, contextText]);

      showToast(summary || 'Árvore genealógica atualizada com sucesso!');
    } finally {
      setIsLoading(false);
    }
  };

  const hasMembers = members.length > 0;

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        memberCount={members.length}
        relationCount={relations.length}
        onClear={handleClearTree}
        onReorganize={handleReorganize}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Main Workspace Canvas */}
      <main className="workspace-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={1.8}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.5}
            color="var(--md-sys-color-outline-variant)"
          />
          <Controls position="top-left" showInteractive={false} />
        </ReactFlow>

        {/* Floating Quick Action Toolbar for Reorganization */}
        {hasMembers && (
          <div className="canvas-floating-toolbar">
            <button
              type="button"
              className="m3-button floating-reorganize-btn"
              onClick={handleReorganize}
              title="Reorganizar e alinhar todos os cards da árvore"
            >
              <Workflow size={16} />
              <span>Otimizar Layout</span>
            </button>
          </div>
        )}

        {/* Empty Workspace Initial State */}
        {!hasMembers && (
          <div className="empty-workspace">
            <div className="empty-workspace-card">
              <div className="empty-icon-circle">
                <Users size={36} />
              </div>
              <h2 className="empty-title">Árvore Genealógica Vazia</h2>
              <p className="empty-description">
                Nenhum membro cadastrado ainda. Clique no botão abaixo para adicionar a primeira pessoa em linguagem natural (ex: <em>&ldquo;meu nome é daniel&rdquo;</em>).
              </p>
              <button
                type="button"
                className="m3-button m3-button--filled empty-button"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus size={20} />
                <span>Adicionar Primeiro Membro</span>
              </button>
            </div>
          </div>
        )}

        {/* Material 3 Floating Action Button (FAB) */}
        <button
          type="button"
          className="m3-fab"
          title="Adicionar à árvore genealógica"
          aria-label="Adicionar familiar"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus size={24} />
          {hasMembers && <span>Adicionar</span>}
        </button>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-banner">
          <CheckCircle2 size={18} style={{ color: 'var(--md-sys-color-inverse-primary)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Add Member Radix Dialog */}
      <AddMemberDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleContextSubmit}
        isLoading={isLoading}
        hasMembers={hasMembers}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
};

export default function App() {
  return (
    <ReactFlowProvider>
      <FamilyTreeFlow />
    </ReactFlowProvider>
  );
}
