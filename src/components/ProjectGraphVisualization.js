import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ProjectGraphVisualization = ({
  groups,
  getBoards,
  getColumns,
  getTasks,
  onSelectTask,
  onSelectBoard,
  focusedTaskId = null,
  visualizationType = 'full'
}) => {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const containerRef = useRef(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewType, setViewType] = useState(visualizationType);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [isSimulationActive, setIsSimulationActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const initializationDone = useRef(false);

  useEffect(() => {
    setLoading(true);
    initializationDone.current = false;
    
    const nodes = [];
    const links = [];
    
    const groupCount = groups.length;
    const centerX = 400; 
    const centerY = 300; 
    
    groups.forEach((group, index) => {
      const angle = (index / groupCount) * 2 * Math.PI;
      const radius = 200;
      
      const groupNode = {
        id: `group-${group.id}`,
        name: group.name,
        type: 'group',
        data: group,
        status: 'normal',
        initialX: Math.cos(angle) * radius,
        initialY: Math.sin(angle) * radius,
        fixed: viewType === 'full' 
      };
      
      nodes.push(groupNode);
      
      const boards = getBoards(group.id);
      const boardCount = boards.length;
      
      boards.forEach((board, boardIndex) => {
        const boardAngle = angle + (boardIndex / boardCount) * Math.PI * 0.5 - Math.PI * 0.25;
        const boardRadius = 120;
        
        const boardNode = {
          id: `board-${board.id}`,
          name: board.name,
          type: 'board',
          data: board,
          status: 'normal',
          initialX: Math.cos(angle) * radius + Math.cos(boardAngle) * boardRadius * 0.5,
          initialY: Math.sin(angle) * radius + Math.sin(boardAngle) * boardRadius * 0.5
        };
        
        nodes.push(boardNode);
        
        links.push({
          source: `group-${group.id}`,
          target: `board-${board.id}`,
          type: 'hierarchy'
        });
        
        const columns = getColumns(board.id);
        
        if (viewType === 'full' || viewType === 'hierarchy') {
          columns.forEach((column, colIndex) => {
            const colOffset = (colIndex - (columns.length - 1) / 2) * 60;
            
            const columnNode = {
              id: `column-${column.id}`,
              name: column.name,
              type: 'column',
              data: column,
              status: 'normal',
              initialX: boardNode.initialX + colOffset * 0.8,
              initialY: boardNode.initialY + 100
            };
            
            nodes.push(columnNode);
            
            links.push({
              source: `board-${board.id}`,
              target: `column-${column.id}`,
              type: 'hierarchy'
            });
            
            const tasks = getTasks(column.id);
            tasks.forEach((task, taskIndex) => {
              const taskNode = {
                id: `task-${task.id}`,
                name: task.content,
                type: 'task',
                data: task,
                status: task.completed ? 'completed' : task.priority || 'normal',
                focused: focusedTaskId === task.id,
                initialX: columnNode.initialX,
                initialY: columnNode.initialY + 70 + taskIndex * 30
              };
              
              nodes.push(taskNode);
              
              links.push({
                source: `column-${column.id}`,
                target: `task-${task.id}`,
                type: 'hierarchy'
              });
              
              if ((viewType === 'full' || viewType === 'dependency') && task.dependencies && task.dependencies.length > 0) {
                task.dependencies.forEach(depId => {
                  links.push({
                    source: `task-${depId}`,
                    target: `task-${task.id}`,
                    type: 'dependency'
                  });
                });
              }
            });
          });
        } else if (viewType === 'dependency') {
          columns.forEach(column => {
            const tasks = getTasks(column.id);
            tasks.forEach(task => {
              if (!nodes.some(n => n.id === `task-${task.id}`)) {
                nodes.push({
                  id: `task-${task.id}`,
                  name: task.content,
                  type: 'task',
                  data: task,
                  status: task.completed ? 'completed' : task.priority || 'normal',
                  focused: focusedTaskId === task.id
                });
              }
              
              if (task.dependencies && task.dependencies.length > 0) {
                task.dependencies.forEach(depId => {
                  if (!nodes.some(n => n.id === `task-${depId}`)) {
                    const allColumns = [];
                    groups.forEach(g => {
                      const groupBoards = getBoards(g.id);
                      groupBoards.forEach(b => {
                        const boardColumns = getColumns(b.id);
                        allColumns.push(...boardColumns);
                      });
                    });
                    
                    let foundTask = null;
                    for (const col of allColumns) {
                      const tasks = getTasks(col.id);
                      foundTask = tasks.find(t => t.id === depId);
                      if (foundTask) break;
                    }
                    
                    if (foundTask) {
                      nodes.push({
                        id: `task-${foundTask.id}`,
                        name: foundTask.content,
                        type: 'task',
                        data: foundTask,
                        status: foundTask.completed ? 'completed' : foundTask.priority || 'normal',
                        focused: focusedTaskId === foundTask.id
                      });
                    }
                  }
                  
                  links.push({
                    source: `task-${depId}`,
                    target: `task-${task.id}`,
                    type: 'dependency'
                  });
                });
              }
            });
          });
        }
      });
    });
    
    setGraphData({ nodes, links });
    setIsSimulationActive(true);
  }, [groups, getBoards, getColumns, getTasks, viewType, focusedTaskId]);

  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%");
  
    const width = svgRef.current.clientWidth || 800; 
    const height = svgRef.current.clientHeight || 600;
    svg.attr("viewBox", [0, 0, width, height]);
  
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "none")
      .attr("pointer-events", "all");
  
    const container = svg.append("g");
    containerRef.current = container;
  
    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });
    
    svg.call(zoom);
    
    svg.call(zoom.transform, d3.zoomIdentity.translate(width/2 - 200, height/2 - 200).scale(0.8));
  
    const simulation = d3.forceSimulation()
      .force("link", d3.forceLink().id(d => d.id))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .alphaDecay(0.02); 
    
    simulationRef.current = simulation;

    simulation.on("tick", () => {
      const padding = 50;
      graphData.nodes.forEach(d => {
        d.x = Math.max(padding, Math.min(width - padding, d.x));
        d.y = Math.max(padding, Math.min(height - padding, d.y));
      });

      container.selectAll(".link")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      container.selectAll(".node-group")
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, []);

  useEffect(() => {
    if (!simulationRef.current || !containerRef.current || graphData.nodes.length === 0) return;

    const simulation = simulationRef.current;
    const container = containerRef.current;
    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    container.selectAll(".link").remove();
    container.selectAll(".node-group").remove();

    graphData.nodes.forEach(node => {
      if (!node.x || !node.y) {
        if (node.initialX && node.initialY) {
          node.x = width / 2 + node.initialX;
          node.y = height / 2 + node.initialY;
        } else if (viewType === 'hierarchy') {
          node.y = node.type === 'group' ? 100 :
                   node.type === 'board' ? 250 :
                   node.type === 'column' ? 400 : 550;
          node.x = width / 2 + (Math.random() - 0.5) * 100;
        } else {
          node.x = width / 2 + (Math.random() - 0.5) * 200;
          node.y = height / 2 + (Math.random() - 0.5) * 200;
        }
      }
      
      if (viewType === 'full') {
        if (node.type === 'group') {
          node.fx = node.x;
          node.fy = node.y;
        } else {
          node.fx = isSimulationActive ? null : node.x;
          node.fy = isSimulationActive ? null : node.y;
        }
      } else {
        node.fx = isSimulationActive ? null : node.x;
        node.fy = isSimulationActive ? null : node.y;
      }
    });

    simulation.nodes(graphData.nodes);
    
    simulation.alpha(1);

    const linkForce = viewType === 'dependency'
      ? d3.forceLink().id(d => d.id).distance(100)
      : d3.forceLink().id(d => d.id).distance(d => {
          if (d.type === 'hierarchy') {
            if (d.source.type === 'group') return 150;
            if (d.source.type === 'board') return 120;
            if (d.source.type === 'column') return 80;
          }
          return 100;
        });
    
    simulation.force("link", linkForce.links(graphData.links));

    if (viewType === 'hierarchy') {
      simulation.force("y", d3.forceY(d => {
        if (d.type === 'group') return 100;
        if (d.type === 'board') return 250;
        if (d.type === 'column') return 400;
        return 550;
      }).strength(0.8));
      simulation.force("collide", d3.forceCollide().radius(d => getNodeSize(d) * 2).strength(0.7));
      simulation.force("group-repulsion", d3.forceManyBody().strength(d => d.type === 'group' ? -500 : 0).distanceMax(300));
    } else if (viewType === 'full') {
      simulation.force("collide", d3.forceCollide().radius(d => getNodeSize(d) * 2.5).strength(0.8));
      simulation.force("charge", d3.forceManyBody().strength(d => {
        if (d.type === 'group') return -600;
        if (d.type === 'board') return -300;
        if (d.type === 'column') return -150;
        return -50;
      }).distanceMax(400));
      
      simulation.force("y", d3.forceY(d => {
        if (d.type === 'group') return height * 0.3;
        if (d.type === 'board') return height * 0.4;
        if (d.type === 'column') return height * 0.5;
        return height * 0.6;
      }).strength(0.1));
      
      simulation.force("structure", d3.forceRadial(
        d => d.type === 'group' ? 0 : 
             d.type === 'board' ? 150 : 
             d.type === 'column' ? 250 : 350,
        width / 2, height / 2
      ).strength(0.1));
    } else {
      simulation.force("collide", d3.forceCollide().radius(30).strength(0.7));
      simulation.force("charge", d3.forceManyBody().strength(-150));
      simulation.force("y", null);
    }

    const linkSelection = container.selectAll(".link")
      .data(graphData.links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", d => d.type === 'dependency' ? "#6d28d9" : "#4f46e5")
      .attr("stroke-opacity", d => d.type === 'dependency' ? 0.8 : 0.4)
      .attr("stroke-width", d => d.type === 'dependency' ? 2 : 1)
      .attr("stroke-dasharray", d => d.type === 'dependency' ? "5,5" : "none");

    const nodeEnter = container.selectAll(".node-group")
      .data(graphData.nodes)
      .enter()
      .append("g")
      .attr("class", "node-group")
      .attr("data-id", d => d.id);
      
    nodeEnter.append("circle")
      .attr("r", d => getNodeSize(d))
      .attr("fill", d => getNodeColor(d))
      .attr("stroke", d => d.focused ? "#f97316" : d.type === 'task' ? "#4b5563" : "#1f2937")
      .attr("stroke-width", d => d.focused ? 3 : 1);
      
    nodeEnter.append("text")
      .attr("class", "icon")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("font-size", d => getIconSize(d))
      .attr("fill", d => {
        if (d.type === 'group') return "#c4b5fd";
        if (d.type === 'board') return "#93c5fd";
        if (d.type === 'column') return "#6ee7b7";
        return "#ffffff";
      })
      .text(d => getNodeIcon(d));
      
    if (showLabels) {
      nodeEnter.append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .attr("dy", d => getNodeSize(d) + 14)
        .attr("font-size", 10)
        .attr("fill", "#ffffff")
        .text(d => d.name.length > 20 ? d.name.substring(0, 18) + "..." : d.name);
    }

    nodeEnter.call(d3.drag()
      .on("start", dragStarted)
      .on("drag", dragged)
      .on("end", dragEnded))
      .on("click", (event, d) => {
        event.stopPropagation();
        handleNodeClick(d);
      })
      .on("mouseover", (event, d) => {
        handleNodeHover(d);
      })
      .on("mouseout", () => {
        if (!selectedNode) {
          setHighlightNodes(new Set());
          setHighlightLinks(new Set());
        }
      });

    const warmupTicks = viewType === 'full' ? 200 : 150;
    for (let i = 0; i < warmupTicks; i++) {
      simulation.tick();
    }
    
    container.selectAll(".link")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    container.selectAll(".node-group")
      .attr("transform", d => `translate(${d.x},${d.y})`);
      
    simulation.alpha(0.3).restart();
    
    if (viewType === 'full') {
      setTimeout(() => {
        simulation.alphaTarget(0);
        
        if (!isSimulationActive) {
          graphData.nodes.forEach(node => {
            node.fx = node.x;
            node.fy = node.y;
          });
        }
      }, 300);
    }
    
    setTimeout(() => {
      setLoading(false);
      initializationDone.current = true;
      
      if (!isSimulationActive) {
        graphData.nodes.forEach(node => {
          node.fx = node.x;
          node.fy = node.y;
        });
        simulation.alphaTarget(0);
      }
    }, 1000);

    return () => {
      simulation.alphaTarget(0);
    };
  }, [graphData, viewType]);

  useEffect(() => {
    if (!containerRef.current || !initializationDone.current) return;

    const container = containerRef.current;

    container.selectAll(".link")
      .attr("stroke", d => {
        if (d.type === 'dependency') {
          return highlightLinks.has(d) ? "#8b5cf6" : "#6d28d9";
        }
        return highlightLinks.has(d) ? "#6366f1" : "#4f46e5";
      })
      .attr("stroke-opacity", d => {
        if (highlightLinks.size > 0) {
          return highlightLinks.has(d) ? 0.8 : 0.2;
        }
        return d.type === 'dependency' ? 0.8 : 0.4;
      });

    container.selectAll(".node-group")
      .each(function(d) {
        const group = d3.select(this);
        
        group.select("circle")
          .attr("stroke", () => {
            if (d.focused) return "#f97316";
            if (selectedNode === d.id) return "#ffffff";
            if (highlightNodes.has(d)) return "#c4b5fd";
            return d.type === 'task' ? "#4b5563" : "#1f2937";
          })
          .attr("stroke-width", () => {
            if (d.focused) return 3;
            if (selectedNode === d.id) return 2;
            return highlightNodes.has(d) ? 2 : 1;
          })
          .attr("opacity", () => {
            if (highlightNodes.size > 0) {
              return highlightNodes.has(d) || selectedNode === d.id ? 1 : 0.3;
            }
            return 1;
          });
          
        const label = group.select("text.label");
        if (!label.empty()) {
          label.attr("fill", () => {
            if (highlightNodes.size > 0) {
              return highlightNodes.has(d) || selectedNode === d.id ? "#ffffff" : "#9ca3af";
            }
            return "#ffffff";
          })
          .attr("opacity", () => {
            if (zoomLevel < 0.5 && !highlightNodes.has(d) && selectedNode !== d.id) {
              return 0;
            }
            return 1;
          });
        }
      });
  }, [highlightNodes, highlightLinks, selectedNode, zoomLevel]);

  useEffect(() => {
    const simulation = simulationRef.current;
    if (!simulation) return;
    
    if (isSimulationActive) {
      graphData.nodes.forEach(node => {
        if (viewType === 'full' && node.type === 'group') {
          node.fx = node.x;
          node.fy = node.y;
        } else {
          node.fx = null;
          node.fy = null;
        }
      });
      
      simulation.alphaTarget(0.1).alpha(0.3).restart();
    } else {
      simulation.alphaTarget(0);
      graphData.nodes.forEach(node => {
        node.fx = node.x;
        node.fy = node.y;
      });
    }
  }, [isSimulationActive, viewType]);

  const dragStarted = (event) => {
    if (!event.active && isSimulationActive) {
      simulationRef.current.alphaTarget(0.1).restart();
    }
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  };

  const dragged = (event) => {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  };

  const dragEnded = (event) => {
    if (!event.active) simulationRef.current.alphaTarget(0);
    
    if (viewType === 'full' && event.subject.type === 'group') {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    } else if (!isSimulationActive) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    } else {
      event.subject.fx = null;
      event.subject.fy = null;
    }
  };

  const getNodeSize = (node) => {
    switch (node.type) {
      case 'group': return 20;
      case 'board': return 16;
      case 'column': return 12;
      case 'task': return node.focused ? 14 : 10;
      default: return 8;
    }
  };

  const getIconSize = (node) => {
    switch (node.type) {
      case 'group': return 14;
      case 'board': return 12;
      case 'column': return 8;
      case 'task': return 8;
      default: return 8;
    }
  };

  const getNodeIcon = (node) => {
    switch (node.type) {
      case 'group': return '📁';
      case 'board': return '📋';
      case 'column': return '📊';
      case 'task': return node.data.completed ? '✓' : '★';
      default: return '•';
    }
  };

  const getNodeColor = (node) => {
    if (node.type === 'group') return '#4c1d95';
    if (node.type === 'board') return '#1e40af';
    if (node.type === 'column') return '#065f46';
    if (node.type === 'task') {
      if (node.status === 'completed') return '#059669';
      if (node.status === 'high') return '#dc2626';
      if (node.status === 'medium') return '#d97706';
      if (node.status === 'low') return '#0891b2';
      if (node.status === 'blocked') return '#7f1d1d';
      return '#4b5563';
    }
    return '#6b7280';
  };

  const handleNodeClick = (node) => {
    if (selectedNode === node.id) {
      setSelectedNode(null);
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }
    setSelectedNode(node.id);
    const connectedNodes = new Set([node]);
    const connectedLinks = new Set();
    graphData.links.forEach(link => {
      if (link.source.id === node.id || link.target.id === node.id) {
        connectedNodes.add(link.source);
        connectedNodes.add(link.target);
        connectedLinks.add(link);
      }
    });
    setHighlightNodes(connectedNodes);
    setHighlightLinks(connectedLinks);
    if (node.type === 'task' && onSelectTask) {
      onSelectTask(node.data.id);
    } else if (node.type === 'board' && onSelectBoard) {
      onSelectBoard(node.data.id);
    }
  };

  const handleNodeHover = (node) => {
    if (selectedNode) return;
    const connectedNodes = new Set([node]);
    const connectedLinks = new Set();
    graphData.links.forEach(link => {
      if (link.source.id === node.id || link.target.id === node.id) {
        connectedNodes.add(link.source);
        connectedNodes.add(link.target);
        connectedLinks.add(link);
      }
    });
    setHighlightNodes(connectedNodes);
    setHighlightLinks(connectedLinks);
  };

  const toggleLabels = () => setShowLabels(!showLabels);

  const changeViewType = (type) => {
    setViewType(type);
    setSelectedNode(null);
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    setIsSimulationActive(true);
  };

  const stabilizeGraph = () => {
    if (!simulationRef.current) return;
    
    setIsSimulationActive(false);
    const simulation = simulationRef.current;
    simulation.alphaTarget(0).alpha(0);
    
    graphData.nodes.forEach(node => {
      node.fx = node.x;
      node.fy = node.y;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-xs rounded-md ${
              viewType === 'full'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => changeViewType('full')}
          >
            Full View
          </button>
          <button
            className={`px-3 py-1 text-xs rounded-md ${
              viewType === 'hierarchy'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => changeViewType('hierarchy')}
          >
            Hierarchy
          </button>
          <button
            className={`px-3 py-1 text-xs rounded-md ${
              viewType === 'dependency'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => changeViewType('dependency')}
          >
            Dependencies
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className={`p-1 rounded-md ${showLabels ? 'text-indigo-400' : 'text-gray-500'}`}
            onClick={toggleLabels}
            title={showLabels ? 'Hide Labels' : 'Show Labels'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            className={`p-1 rounded-md ${isSimulationActive ? 'text-indigo-400' : 'text-gray-500'}`}
            onClick={() => setIsSimulationActive(!isSimulationActive)}
            title={isSimulationActive ? 'Pause Layout' : 'Resume Layout'}
          >
            {isSimulationActive ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          {isSimulationActive && viewType === 'full' && (
            <button
              className="px-2 py-1 text-xs bg-indigo-700 text-white rounded-md"
              onClick={stabilizeGraph}
              title="Stabilize Graph"
            >
              Stabilize
            </button>
          )}
          <div className="text-xs text-gray-400">
            {Math.round(zoomLevel * 100)}%
          </div>
        </div>
      </div>
      <div className="flex-1 bg-gray-900 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900 bg-opacity-70">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="text-white ml-4 text-lg">Loading visualization...</span>
          </div>
        )}
        <svg ref={svgRef} className="w-full h-full" />
      </div>
      {selectedNode && (
        <div className="p-3 bg-gray-800 border-t border-gray-700">
          <div className="text-sm text-white font-medium">
            {graphData.nodes.find(n => n.id === selectedNode)?.name}
          </div>
          <div className="text-xs text-gray-400">
            {graphData.nodes.find(n => n.id === selectedNode)?.type}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectGraphVisualization;