import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, Sparkles, TrendingUp, ShieldCheck, Sliders, ArrowUpRight } from 'lucide-react';
import { DigitalTwinSim } from '../types';

interface DigitalTwinProps {
  onOpenAIChat: () => void;
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({ onOpenAIChat }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Simulation state
  const [sim, setSim] = useState<DigitalTwinSim>({
    incomeChange: 15,
    extraMonthlyPayment: 500,
    savingsRate: 20,
  });

  // Derived twin outputs
  const baseCreditScore = 742;
  const simulatedCreditScore = Math.min(850, baseCreditScore + Math.round(sim.incomeChange * 0.8 + sim.extraMonthlyPayment * 0.04));
  const baseCapacity = 1250000;
  const simulatedCapacity = Math.round(baseCapacity * (1 + (sim.incomeChange / 100) * 1.4));
  const approvalProbability = Math.min(99, Math.round(45 + sim.incomeChange * 0.9 + (sim.extraMonthlyPayment / 50)));

  // Interactive Neural Sphere Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = 400);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 400;
    };
    window.addEventListener('resize', handleResize);

    // Node particles
    const nodes: { x: number; y: number; z: number; radius: number; baseR: number; speedX: number; speedY: number; color: string }[] = [];
    const numNodes = 28;

    for (let i = 0; i < numNodes; i++) {
      const radius = 6 + Math.random() * 12;
      nodes.push({
        x: (Math.random() - 0.5) * (width * 0.6),
        y: (Math.random() - 0.5) * (height * 0.6),
        z: (Math.random() - 0.5) * 200,
        radius,
        baseR: radius,
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: (Math.random() - 0.5) * 0.6,
        color: i % 3 === 0 ? '#4edea3' : i % 2 === 0 ? '#10b981' : '#a7b6cc',
      });
    }

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      angle += 0.008;

      // Draw outer glowing halo behind twin
      const grad = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, 180);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
      grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.08)');
      grad.addColorStop(1, 'rgba(14, 21, 17, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 200, 0, Math.PI * 2);
      ctx.fill();

      // Transform & rotate 3D nodes
      const projectedNodes = nodes.map((node) => {
        // Y-axis rotation
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rx = node.x * cos - node.z * sin;
        const rz = node.z * cos + node.x * sin;

        const scale = 300 / (300 + rz);
        return {
          px: centerX + rx * scale,
          py: centerY + node.y * scale,
          scale,
          color: node.color,
          radius: node.radius * scale,
        };
      });

      // Draw connecting filaments/lines
      for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const p1 = projectedNodes[i];
          const p2 = projectedNodes[j];
          const dist = Math.hypot(p1.px - p2.px, p1.py - p2.py);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.strokeStyle = `rgba(78, 222, 163, ${(1 - dist / 110) * 0.35})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw glowing node spheres
      projectedNodes.sort((a, b) => a.scale - b.scale);
      projectedNodes.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.px, p.py, p.radius, 0, Math.PI * 2);
        
        // Node Radial Glow
        const nodeGrad = ctx.createRadialGradient(p.px, p.py, 1, p.px, p.py, p.radius * 2);
        nodeGrad.addColorStop(0, '#ffffff');
        nodeGrad.addColorStop(0.4, p.color);
        nodeGrad.addColorStop(1, 'rgba(16,185,129,0)');
        
        ctx.fillStyle = nodeGrad;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section id="digital-twin" className="relative py-20 lg:py-28 overflow-hidden bg-[#09100c]">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-[#10b981]/10 blur-[180px]" />

      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 text-xs font-bold tracking-[0.2em] text-[#4edea3] uppercase mb-3">
            <Cpu className="h-4 w-4" />
            <span>FINANCIAL DIGITAL TWIN</span>
          </div>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-[#dde4dd] sm:text-5xl lg:text-6xl">
            See Your Financial Future.
          </h2>
          <p className="mt-4 text-sm text-[#bbcabf] max-w-xl mx-auto">
            A real-time AI replica of your financial footprint simulating borrowing limits, interest trajectories, and wealth creation.
          </p>
        </div>

        {/* Central Display Container */}
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Floating Card: Financial Health */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 z-10 glass-panel rounded-2xl p-5 border border-[#3c4a42] shadow-2xl"
          >
            <div className="text-xs font-semibold text-[#86948a] uppercase tracking-wider mb-4 border-b border-[#242c27] pb-2">
              FINANCIAL HEALTH
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#bbcabf]">Credit Score</span>
                  <span className="rounded-full bg-[#10b981]/20 px-2 py-0.5 text-[10px] font-bold text-[#4edea3]">
                    Low Risk
                  </span>
                </div>
                <div className="mt-1 text-2xl font-bold font-mono text-[#dde4dd]">
                  {simulatedCreditScore}
                  {simulatedCreditScore > baseCreditScore && (
                    <span className="ml-2 text-xs text-[#4edea3] font-sans font-normal">
                      (+{simulatedCreditScore - baseCreditScore})
                    </span>
                  )}
                </div>
              </div>

              <hr className="border-[#242c27]" />

              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#bbcabf]">Loan Eligibility Approved</span>
                  <span className="text-xs font-mono font-bold text-[#4edea3]">{approvalProbability}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#1a211d]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#10b981] to-[#4edea3] transition-all duration-500"
                    style={{ width: `${approvalProbability}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Center Column: Interactive Neural Orb Canvas */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full" />
              <div className="absolute pointer-events-none text-center">
                <span className="text-xs font-mono font-semibold text-[#4edea3] uppercase tracking-widest block mb-1">
                  TWIN ENGINE ACTIVE
                </span>
                <span className="text-xl font-bold text-[#dde4dd] font-serif">
                  $
                  {(simulatedCapacity).toLocaleString()}
                </span>
                <span className="text-[10px] text-[#86948a] block mt-0.5">Projected Capacity</span>
              </div>
            </div>
          </div>

          {/* Right Floating Card: Smart Insights */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 z-10 glass-panel rounded-2xl p-5 border border-[#3c4a42] shadow-2xl"
          >
            <div className="text-xs font-semibold text-[#86948a] uppercase tracking-wider mb-4 border-b border-[#242c27] pb-2">
              SMART INSIGHTS
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between text-[#bbcabf]">
                  <span>Borrowing Capacity</span>
                  <span className="text-[10px] text-[#86948a]">2.4M pts/sec</span>
                </div>
                <div className="mt-1 text-lg font-bold font-mono text-[#4edea3]">
                  ${simulatedCapacity.toLocaleString()}
                </div>
                <div className="text-[10px] text-[#86948a] mt-0.5">
                  ₹{Math.round(simulatedCapacity * 83).toLocaleString()} INR equivalent
                </div>
              </div>

              <hr className="border-[#242c27]" />

              <div>
                <div className="flex items-center justify-between text-[#bbcabf]">
                  <span>Monthly Recommendation</span>
                  <span className="rounded-full bg-[#10b981]/20 px-2 py-0.5 text-[9px] font-bold text-[#4edea3]">
                    Active
                  </span>
                </div>
                <div className="mt-1 text-base font-bold font-mono text-[#dde4dd]">
                  $1,800 EMI / mo
                </div>
                <div className="text-[10px] text-[#86948a] mt-0.5">
                  ₹18,000 EMI optimized for liquidity
                </div>
              </div>
            </div>

            <button
              onClick={onOpenAIChat}
              className="mt-5 w-full flex items-center justify-center space-x-1.5 rounded-xl border border-[#4edea3]/30 bg-[#161d19] py-2 text-xs font-bold text-[#4edea3] hover:bg-[#1a211d] hover:border-[#4edea3]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>CONSULT DIGITAL TWIN AI</span>
            </button>
          </motion.div>

        </div>

        {/* Interactive Future Simulation Controls Bar */}
        <div className="mt-12 rounded-2xl glass-panel p-6 border border-[#242c27]">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#4edea3] uppercase tracking-wider mb-4">
            <Sliders className="h-4 w-4" />
            <span>Digital Twin Future Scenario Simulator</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-xs text-[#bbcabf] mb-1">
                <span>Income Growth Scenario</span>
                <span className="font-mono text-[#4edea3]">+{sim.incomeChange}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={sim.incomeChange}
                onChange={(e) => setSim({ ...sim, incomeChange: Number(e.target.value) })}
                className="w-full accent-[#10b981] bg-[#1a211d] h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#bbcabf] mb-1">
                <span>Extra Monthly Debt Reduction</span>
                <span className="font-mono text-[#4edea3]">${sim.extraMonthlyPayment}/mo</span>
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                step="100"
                value={sim.extraMonthlyPayment}
                onChange={(e) => setSim({ ...sim, extraMonthlyPayment: Number(e.target.value) })}
                className="w-full accent-[#10b981] bg-[#1a211d] h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-[#bbcabf] mb-1">
                <span>Target Liquidity Sweep</span>
                <span className="font-mono text-[#4edea3]">{sim.savingsRate}% Income</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={sim.savingsRate}
                onChange={(e) => setSim({ ...sim, savingsRate: Number(e.target.value) })}
                className="w-full accent-[#10b981] bg-[#1a211d] h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
