import { Calculator, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";

const Login = () => {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Calculator className="h-8 w-8 text-primary-foreground" />
            <span className="text-2xl font-bold text-primary-foreground">Valora Plus</span>
          </div>
          <p className="text-primary-foreground/80">Accede para empezar tu análisis gratuito</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;