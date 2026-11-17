import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { AvatarSvg } from './AvatarSvg';
import type { PersonNodeData } from '../types';
import { Trash2, Heart, Sparkles, User, PawPrint } from 'lucide-react';
import { isPetMember } from '../utils/petDetector';

export const FamilyCardNode: React.FC<NodeProps> = memo(({ data }) => {
  const nodeData = data as unknown as PersonNodeData;
  const { id, name, relation, gender, onDelete } = nodeData;

  const isPet = isPetMember(relation, nodeData.isPet);
  const isRoot = !isPet && relation?.toLowerCase() === 'eu';
  const isSpouse = !isPet && /espos[oa]|marido|c[oô]njuge/i.test(relation || '');

  return (
    <div
      className={`family-card ${isRoot ? 'family-card--root' : ''} ${isPet ? 'family-card--pet' : ''}`}
      style={{
        width: 240,
        backgroundColor: isPet
          ? 'var(--md-sys-color-surface-container)'
          : isRoot
          ? 'var(--md-sys-color-surface-container-high)'
          : 'var(--md-sys-color-surface-container-low)',
        border: `1.5px solid ${
          isPet
            ? 'var(--md-sys-color-tertiary)'
            : isRoot
            ? 'var(--md-sys-color-primary)'
            : 'var(--md-sys-color-outline-variant)'
        }`,
        borderRadius: 'var(--md-sys-shape-corner-large)',
        padding: '12px',
        boxShadow: 'var(--md-sys-elevation-1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
        transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
        fontFamily: 'var(--md-sys-typescale-font)',
      }}
    >
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          background: isPet ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-primary)',
          width: 8,
          height: 8,
          border: '2px solid var(--md-sys-color-surface)',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: isPet ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-primary)',
          width: 8,
          height: 8,
          border: '2px solid var(--md-sys-color-surface)',
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          background: 'var(--md-sys-color-secondary)',
          width: 6,
          height: 6,
          border: '2px solid var(--md-sys-color-surface)',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: 'var(--md-sys-color-secondary)',
          width: 6,
          height: 6,
          border: '2px solid var(--md-sys-color-surface)',
        }}
      />

      {/* SVG Avatar with Pet Badge indicator */}
      <div
        style={{
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            border: `2px solid ${
              isPet
                ? 'var(--md-sys-color-tertiary)'
                : isRoot
                ? 'var(--md-sys-color-primary)'
                : 'var(--md-sys-color-surface-variant)'
            }`,
            borderRadius: '50%',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--md-sys-color-surface)',
          }}
        >
          <AvatarSvg name={name} gender={gender} relation={relation} isPet={isPet} size={50} />
        </div>

        {isPet && (
          <div
            title="Pet da família"
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              backgroundColor: 'var(--md-sys-color-tertiary)',
              color: 'var(--md-sys-color-on-tertiary)',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--md-sys-color-surface)',
              boxShadow: 'var(--md-sys-elevation-1)',
            }}
          >
            <PawPrint size={10} />
          </div>
        )}
      </div>

      {/* Info column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          title={name}
          style={{
            color: 'var(--md-sys-color-on-surface)',
            fontSize: '15px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.25,
            marginBottom: '4px',
          }}
        >
          {name}
        </div>

        {/* Relationship chip with paw icon for pets */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: isPet
              ? 'var(--md-sys-color-tertiary-container)'
              : isRoot
              ? 'var(--md-sys-color-primary-container)'
              : 'var(--md-sys-color-secondary-container)',
            color: isPet
              ? 'var(--md-sys-color-on-tertiary-container)'
              : isRoot
              ? 'var(--md-sys-color-on-primary-container)'
              : 'var(--md-sys-color-on-secondary-container)',
            borderRadius: 'var(--md-sys-shape-corner-small)',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.1px',
          }}
        >
          {isPet ? (
            <PawPrint size={12} />
          ) : isRoot ? (
            <Sparkles size={11} />
          ) : isSpouse ? (
            <Heart size={11} />
          ) : (
            <User size={11} />
          )}
          <span>{relation || (isPet ? 'Pet' : 'Familiar')}</span>
        </div>
      </div>

      {/* Delete button (shows on card hover via CSS) */}
      {onDelete && (
        <button
          className="family-card__delete-btn"
          title="Remover este membro"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: 'var(--md-sys-color-error)',
            color: 'var(--md-sys-color-on-error)',
            border: 'none',
            borderRadius: '50%',
            width: '22px',
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--md-sys-elevation-2)',
            transition: 'transform 0.15s ease',
          }}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
});
