import { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Alert, CircularProgress, ToggleButtonGroup, ToggleButton, Slider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

interface CollaborationGraphProps {
  scholarId: string;
}

type LayoutType = 'hierarchical' | 'grid' | 'organic';

export default function CollaborationGraph({ scholarId }: CollaborationGraphProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collaborationData, setCollaborationData] = useState<any>(null);
  const [layoutType, setLayoutType] = useState<LayoutType>('hierarchical');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [maxNodes, setMaxNodes] = useState<number>(25);

  useEffect(() => {
    const fetchCollaborations = async () => {
      try {
        setLoading(true);
        const data = await api.getScholarCollaborations(scholarId);
        setCollaborationData(data);
        if (data?.nodes && data.nodes.length > 0) {
          const totalNodes = data.nodes.length;
          setMaxNodes(totalNodes);
        }
      } catch (err: any) {
        if (err.message !== 'BACKEND_NOT_CONNECTED') {
          setError(t('failedToLoadCollaborationData'));
          console.error('Error fetching collaborations:', err);
        }
      } finally {
        setLoading(false);
      }
    };
    if (scholarId) {
      fetchCollaborations();
    }
  }, [scholarId]);

  const graphLayout = useMemo(() => {
    if (!collaborationData?.nodes || collaborationData.nodes.length === 0) {
      return { nodes: [], links: [], width: 900, height: 600, totalNodes: 0, displayedNodes: 0 };
    }

    const allNodes = collaborationData.nodes || [];
    const allLinks = collaborationData.links || [];
    const totalNodes = allNodes.length;
    
    const nodes = allNodes.slice(0, maxNodes);
    const displayedNodeIds = new Set(nodes.map((n: any) => n.id));
    
    const links = allLinks.filter((link: any) => 
      displayedNodeIds.has(link.source) && displayedNodeIds.has(link.target)
    );
    
    const width = 900;
    const height = 600;

    let positionedNodes: any[] = [];

    let finalHeight = height;

    if (layoutType === 'hierarchical') {
      const centerNode = nodes[0];
      positionedNodes.push({
        ...centerNode,
        x: width / 2,
        y: 80,
        radius: 35,
        isCenter: true,
      });

      const collaborators = nodes.slice(1);
      const colsPerRow = Math.ceil(Math.sqrt(collaborators.length));
      const rowHeight = 140; // Increased to accommodate text labels
      const colSpacing = width / (colsPerRow + 1);
      const topMargin = 180; // Start collaborators lower to leave room for center label

      collaborators.forEach((node: any, index: number) => {
        const row = Math.floor(index / colsPerRow);
        const col = (index % colsPerRow) + 1;
        positionedNodes.push({
          ...node,
          x: col * colSpacing,
          y: topMargin + row * rowHeight,
          radius: 28,
          isCenter: false,
        });
      });
      
      const totalRows = Math.ceil(collaborators.length / colsPerRow);
      finalHeight = topMargin + totalRows * rowHeight + 100;
    } else if (layoutType === 'grid') {
      const cols = Math.ceil(Math.sqrt(nodes.length));
      const rows = Math.ceil(nodes.length / cols);
      const colSpacing = width / (cols + 1);
      const rowSpacing = height / (rows + 1);

      nodes.forEach((node: any, index: number) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        positionedNodes.push({
          ...node,
          x: (col + 1) * colSpacing,
          y: (row + 1) * rowSpacing,
          radius: index === 0 ? 32 : 26,
          isCenter: index === 0,
        });
      });
    } else {
      const centerNode = nodes[0];
      positionedNodes.push({
        ...centerNode,
        x: width / 2,
        y: height / 2,
        radius: 35,
        isCenter: true,
      });

      const collaborators = nodes.slice(1);
      const angleStep = (2 * Math.PI) / (collaborators.length || 1);
      const baseRadius = 180;

      collaborators.forEach((node: any, index: number) => {
        const angle = angleStep * index;
        const radius = baseRadius + (index % 3) * 40; // Vary radius slightly
        const x = width / 2 + radius * Math.cos(angle);
        const y = height / 2 + radius * Math.sin(angle);
        positionedNodes.push({
          ...node,
          x: Math.max(50, Math.min(width - 50, x)),
          y: Math.max(100, Math.min(height - 100, y)),
          radius: 28,
          isCenter: false,
        });
      });
    }

    return {
      nodes: positionedNodes,
      links,
      width,
      height: finalHeight,
      totalNodes,
      displayedNodes: nodes.length,
    };
  }, [collaborationData, layoutType, maxNodes]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('collaborationGraph')}
        </Typography>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  if (!collaborationData || !collaborationData.nodes || collaborationData.nodes.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('collaborationGraph')}
        </Typography>
        <Alert severity="info">
          {t('noCollaborationData')}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
            {t('collaborationGraph')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {collaborationData?.nodes?.length > 0 && graphLayout && (
              <Typography variant="body2" color="text.secondary">
                {graphLayout.displayedNodes || 0} / {graphLayout.totalNodes || 0} {t('connections')}
              </Typography>
            )}
            <ToggleButtonGroup
              value={layoutType}
              exclusive
              onChange={(_, newLayout) => newLayout && setLayoutType(newLayout)}
              size="small"
            >
              <ToggleButton value="hierarchical">{t('hierarchical')}</ToggleButton>
              <ToggleButton value="grid">{t('grid')}</ToggleButton>
              <ToggleButton value="organic">{t('organic')}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        {collaborationData?.nodes && collaborationData.nodes.length > 1 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', px: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
              {maxNodes} / {collaborationData.nodes.length}
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Slider
                value={maxNodes}
                onChange={(_, value) => setMaxNodes(value as number)}
                min={Math.max(1, Math.min(5, collaborationData.nodes.length))}
                max={collaborationData.nodes.length}
                step={1}
                valueLabelDisplay="auto"
                sx={{
                  '& .MuiSlider-thumb': {
                    width: 18,
                    height: 18,
                  },
                  '& .MuiSlider-track': {
                    height: 4,
                  },
                  '& .MuiSlider-rail': {
                    height: 4,
                  },
                }}
              />
            </Box>
          </Box>
        )}
      </Box>
      <Box 
        sx={{ 
          width: '100%', 
          background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
          borderRadius: 3, 
          overflow: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 600,
          p: 3,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(25, 118, 210, 0.2), transparent)',
          }
        }}
      >
        <svg
          width={graphLayout.width}
          height={graphLayout.height}
          style={{ display: 'block' }}
        >
          <defs>
            {/* Shadow filter */}
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="0" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Hover shadow filter */}
            <filter id="shadowHover" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="5"/>
              <feOffset dx="0" dy="4" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.4"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Center node gradient */}
            <linearGradient id="centerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1976d2" stopOpacity="1" />
              <stop offset="100%" stopColor="#1565c0" stopOpacity="1" />
            </linearGradient>
            
            {/* Collaborator node gradient */}
            <linearGradient id="collaboratorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#f5f5f5" stopOpacity="1" />
            </linearGradient>
            
            {/* Hover gradient for center */}
            <linearGradient id="centerHoverGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2196f3" stopOpacity="1" />
              <stop offset="100%" stopColor="#1976d2" stopOpacity="1" />
            </linearGradient>
            
            {/* Hover gradient for collaborator */}
            <linearGradient id="collaboratorHoverGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e8f5e9" stopOpacity="1" />
              <stop offset="100%" stopColor="#c8e6c9" stopOpacity="1" />
            </linearGradient>
            
            {/* Link gradient */}
            <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Draw links first (behind nodes) */}
          <g stroke="url(#linkGradient)" strokeWidth="2.5" fill="none" strokeLinecap="round">
            {graphLayout.links.map((link: any, index: number) => {
              const sourceNode = graphLayout.nodes.find((n: any) => n.id === link.source);
              const targetNode = graphLayout.nodes.find((n: any) => n.id === link.target);
              
              if (!sourceNode || !targetNode) return null;

              const dx = targetNode.x - sourceNode.x;
              const dy = targetNode.y - sourceNode.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance === 0) return null;

              const sourceRadius = sourceNode.radius || 25;
              const targetRadius = targetNode.radius || 25;
              
              const x1 = sourceNode.x + (dx / distance) * sourceRadius;
              const y1 = sourceNode.y + (dy / distance) * sourceRadius;
              const x2 = targetNode.x - (dx / distance) * targetRadius;
              const y2 = targetNode.y - (dy / distance) * targetRadius;

              const isHovered = hoveredNodeId === link.source || hoveredNodeId === link.target;

              return (
                <line
                  key={`link-${index}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  strokeOpacity={isHovered ? 0.9 : 0.4}
                  strokeWidth={isHovered ? 3 : 2.5}
                  style={{ transition: 'all 0.3s ease' }}
                />
              );
            })}
          </g>

          {/* Draw nodes */}
          {graphLayout.nodes.map((node: any, index: number) => {
            const isCenter = node.isCenter;
            const radius = node.radius || 25;
            const isHovered = hoveredNodeId === node.id;
            const currentRadius = isHovered ? radius + 3 : radius;
            
            const handleNodeClick = () => {
              if (node.id) {
                navigate(`/scholar/${node.id}`);
              }
            };
            
            return (
              <g 
                key={`node-${index}`}
                onClick={handleNodeClick}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Clip path for image - defined per node */}
                <defs>
                  <clipPath id={`node-clip-${index}`}>
                    <circle cx={0} cy={0} r={currentRadius} />
                  </clipPath>
                </defs>
                
                {/* Node circle */}
                <g transform={`translate(${node.x}, ${node.y})`}>
                  {/* Outer glow ring on hover */}
                  {isHovered && (
                    <circle
                      cx={0}
                      cy={0}
                      r={currentRadius + 5}
                      fill="none"
                      stroke={isCenter ? '#2196f3' : '#66bb6a'}
                      strokeWidth="2"
                      strokeOpacity="0.3"
                    />
                  )}
                  
                  <circle
                    cx={0}
                    cy={0}
                    r={currentRadius}
                    fill={node.image ? 'transparent' : (isHovered 
                      ? (isCenter ? 'url(#centerHoverGradient)' : 'url(#collaboratorHoverGradient)')
                      : (isCenter ? 'url(#centerGradient)' : 'url(#collaboratorGradient)')
                    )}
                    stroke={isHovered 
                      ? (isCenter ? '#1565c0' : '#4caf50')
                      : (isCenter ? '#1565c0' : '#66bb6a')
                    }
                    strokeWidth={isCenter ? (isHovered ? 5 : 4) : (isHovered ? 4 : 3)}
                    filter={isHovered ? 'url(#shadowHover)' : 'url(#shadow)'}
                    style={{ 
                      transition: 'all 0.3s ease',
                      transformOrigin: '0 0'
                    }}
                  />
                  
                  {/* Node image if available */}
                  {node.image && (
                    <image
                      href={node.image}
                      x={-currentRadius}
                      y={-currentRadius}
                      width={currentRadius * 2}
                      height={currentRadius * 2}
                      clipPath={`url(#node-clip-${index})`}
                      preserveAspectRatio="xMidYMid slice"
                      style={{ 
                        transition: 'all 0.3s ease',
                        pointerEvents: 'none'
                      }}
                      onError={(e: any) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  
                  {/* Initial letter - only show if no image */}
                  {!node.image && (
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={isCenter ? '#ffffff' : '#424242'}
                      fontSize={isCenter ? (isHovered ? 22 : 20) : (isHovered ? 18 : 16)}
                      fontWeight="bold"
                      fontFamily="Roboto, sans-serif"
                      style={{ 
                        transition: 'all 0.3s ease',
                        pointerEvents: 'none'
                      }}
                    >
                      {node.name?.charAt(0)?.toLocaleUpperCase(language === 'tr' ? 'tr-TR' : 'en-US') || '?'}
                    </text>
                  )}
                </g>
                
                {/* Name label */}
                <text
                  x={node.x}
                  y={node.y + currentRadius + (layoutType === 'hierarchical' && isCenter ? 12 : 18)}
                  textAnchor="middle"
                  dominantBaseline="hanging"
                  fill={isHovered ? (isCenter ? '#1565c0' : '#2e7d32') : '#333333'}
                  fontSize={isCenter ? (isHovered ? 14 : 13) : (isHovered ? 12 : 11)}
                  fontWeight={isCenter ? 600 : 500}
                  fontFamily="Roboto, sans-serif"
                  style={{ 
                    transition: 'all 0.3s ease',
                    pointerEvents: 'none',
                    textShadow: '0 1px 2px rgba(255, 255, 255, 0.8), 0 0 4px rgba(255, 255, 255, 0.6)'
                  }}
                >
                  {node.name && node.name.length > (layoutType === 'grid' ? 20 : 28) 
                    ? node.name.substring(0, (layoutType === 'grid' ? 18 : 26)) + '...' 
                    : node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </Box>
    </Box>
  );
}
