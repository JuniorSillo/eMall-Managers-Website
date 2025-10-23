interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
  }
  
  export function Logo({ className = "", size = 'md' }: LogoProps) {
    const sizeClasses = {
      sm: 'text-lg',
      md: 'text-2xl',
      lg: 'text-4xl'
    };
  
    return (
      <h1 className={`font-bold text-green-600 ${sizeClasses[size]} ${className}`}>
        e<span className="italic">MALL</span>
      </h1>
    );
  }
  