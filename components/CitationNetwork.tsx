
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Claim, CitationResult } from '../types';

interface CitationNetworkProps {
  claims: Claim[];
  citations: CitationResult[];
}

const CitationNetwork: React.FC<CitationNetworkProps> = ({ claims, citations }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || (claims.length === 0 && citations.length === 0)) return;

    const width = 800;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const nodes = [
      { id: 'Root', group: 0, label: 'Analysis Root', radius: 20 },
      ...claims.map(c => ({ 
        id: `claim-${c.id}`, 
        group: 1, 
        label: `Claim ${c.id}`, 
        radius: 12,
        info: c.text
      })),
      ...citations.map((c, i) => ({ 
        id: `cit-${i}`, 
        group: 2, 
        label: c.source_type, 
        radius: 10,
        status: c.verified ? 'verified' : 'unverified',
        info: c.metadata?.title || c.citation
      }))
    ];

    const links = [
      ...claims.map(c => ({ source: 'Root', target: `claim-${c.id}` })),
      ...citations.map((_, i) => ({ source: 'Root', target: `cit-${i}` }))
    ];

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2);

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<SVGGElement, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x; d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        }));

    node.append("circle")
      .attr("r", (d: any) => d.radius)
      .attr("fill", (d: any) => {
        if (d.group === 0) return "#3b82f6";
        if (d.group === 1) return "#f59e0b";
        return d.status === 'verified' ? "#22c55e" : "#ef4444";
      })
      .attr("stroke", "rgba(255,255,255,0.2)")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(0px 0px 4px rgba(0,0,0,0.3))");

    node.append("text")
      .attr("dy", (d: any) => d.radius + 15)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .text((d: any) => d.label);

    node.append("title")
      .text((d: any) => d.info || d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

  }, [claims, citations]);

  return (
    <div className="glass rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <h3 className="font-bold text-sm uppercase tracking-widest text-blue-400">VeriGraph™ Engine</h3>
        <div className="flex gap-4 text-[10px] font-bold">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> ROOT</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> CLAIM</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> VERIFIED</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> RISK</span>
        </div>
      </div>
      <svg ref={svgRef} width="100%" height="400" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet" className="bg-slate-950/20" />
    </div>
  );
};

export default CitationNetwork;
