import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0A0C14] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center max-w-md"
      >
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <FileQuestion className="w-12 h-12 text-violet-500" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">404</h1>
        <h2 className="text-xl font-semibold text-slate-300 mb-4">Página no encontrada</h2>
        
        <p className="text-slate-500 mb-8 leading-relaxed">
          Lo sentimos, la página que estás buscando no existe, fue eliminada o su URL cambió.
        </p>

        <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white w-full sm:w-auto h-11 px-8">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Volver al Inicio
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
