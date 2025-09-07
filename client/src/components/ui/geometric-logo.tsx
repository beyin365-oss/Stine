interface GeometricLogoProps {
  className?: string;
}

export function GeometricLogo({ className = "w-8 h-8" }: GeometricLogoProps) {
  return (
    <div className={`diamond-shape bg-gradient-to-br from-primary via-secondary to-accent ${className}`} />
  );
}

export function StineLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="relative">
        {/* Inspired by your geometric sketch - layered geometric shapes */}
        <div className="w-8 h-12 relative">
          {/* Top diamond */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-4 diamond-shape bg-gradient-to-br from-primary to-secondary"></div>
          {/* Middle rectangle */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 geometric-clip bg-gradient-to-br from-secondary to-accent"></div>
          {/* Bottom diamond */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-4 diamond-shape bg-gradient-to-br from-accent to-primary"></div>
        </div>
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-wider">STINE</h1>
        <p className="text-xs text-muted-foreground tracking-wide">DJ STREAMING PLATFORM</p>
      </div>
    </div>
  );
}
