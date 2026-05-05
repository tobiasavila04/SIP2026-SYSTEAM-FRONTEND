import { useNavigate } from "react-router-dom";
import { ProjectForm } from "@/components/project-form";

export default function CreateProject({ token }) {
  const navigate = useNavigate();

  const manejarExito = () => {
    navigate("/proyectos");
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <ProjectForm token={token} onSuccess={manejarExito} onCancel={() => navigate("/proyectos")} />
    </div>
  );
}
