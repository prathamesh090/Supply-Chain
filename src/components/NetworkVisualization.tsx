import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Node {
  id: string;
  x: number;
  y: number;
  radius: number;
  connections: string[];
}

export function NetworkVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const nodesRef = useRef<Node[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize nodes
    const initNodes = () => {
      const nodes: Node[] = [];
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      
      // Create main hub nodes
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const radius = Math.min(width, height) * 0.3;
        const x = width / 2 + Math.cos(angle) * radius;
        const y = height / 2 + Math.sin(angle) * radius;
        
        nodes.push({
          id: `hub-${i}`,
          x,
          y,
          radius: 6,
          connections: []
        });
      }

      // Create smaller satellite nodes
      for (let i = 0; i < 20; i++) {
        nodes.push({
          id: `sat-${i}`,
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 3,
          connections: []
        });
      }

      // Create connections
      nodes.forEach((node, index) => {
        if (node.id.startsWith('hub')) {
          // Hub nodes connect to nearby nodes
          nodes.forEach((otherNode, otherIndex) => {
            if (index !== otherIndex) {
              const distance = Math.sqrt(
                Math.pow(node.x - otherNode.x, 2) + 
                Math.pow(node.y - otherNode.y, 2)
              );
              if (distance < 200 && Math.random() > 0.7) {
                node.connections.push(otherNode.id);
              }
            }
          });
        }
      });

      nodesRef.current = nodes;
    };

    initNodes();

    // Animation
    let time = 0;
    const animate = () => {
      time += 0.02;
      
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      
      ctx.clearRect(0, 0, width, height);

      // Draw connections with gradient
      nodesRef.current.forEach(node => {
        node.connections.forEach(connectionId => {
          const connectedNode = nodesRef.current.find(n => n.id === connectionId);
          if (!connectedNode) return;

          const gradient = ctx.createLinearGradient(node.x, node.y, connectedNode.x, connectedNode.y);
          gradient.addColorStop(0, 'rgba(88, 0, 255, 0.3)');
          gradient.addColorStop(0.5, 'rgba(0, 150, 255, 0.2)');
          gradient.addColorStop(1, 'rgba(0, 215, 255, 0.1)');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(connectedNode.x, connectedNode.y);
          ctx.stroke();
        });
      });

      // Draw nodes with pulsing effect
      nodesRef.current.forEach((node, index) => {
        const pulse = 1 + Math.sin(time + index * 0.5) * 0.2;
        const radius = node.radius * pulse;

        // Node glow
        const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 3);
        if (node.id.startsWith('hub')) {
          glowGradient.addColorStop(0, 'rgba(88, 0, 255, 0.4)');
          glowGradient.addColorStop(1, 'rgba(88, 0, 255, 0)');
        } else {
          glowGradient.addColorStop(0, 'rgba(0, 215, 255, 0.3)');
          glowGradient.addColorStop(1, 'rgba(0, 215, 255, 0)');
        }

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Node core
        if (node.id.startsWith('hub')) {
          ctx.fillStyle = '#5800FF';
        } else {
          ctx.fillStyle = '#00D7FF';
        }
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Node highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(node.x - radius * 0.3, node.y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ filter: 'blur(0.5px)' }}
      />
      <div className="absolute inset-0 bg-gradient-hero" />
    </motion.div>
  );
}