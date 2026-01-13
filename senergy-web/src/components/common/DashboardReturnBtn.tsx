import React from "react";
import { useNavigate } from "react-router-dom";

interface DashboardBtnProps {
  text?: string;
  iconClass?: string;
  to?: string; // path to navigate
  onClick?: () => void; // optional extra click handler
}

export const DashboardReturnBtn: React.FC<DashboardBtnProps> = ({
  text = "Dashboard",
  iconClass = "fas fa-arrow-left",
  to = "/dashboard",
  onClick,
}) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => {
        if (onClick) onClick();  // call extra handler
        navigate(to);             // navigate after
      }}
      className="group relative px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 
                 border border-slate-200/60 hover:border-slate-300 hover:bg-slate-50/80
                 flex items-center gap-2 overflow-hidden
                 transform transition-transform duration-300 hover:scale-105"
    >
      {/* Shine effect */}
      <span
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                   translate-x-full group-hover:translate-x-0 
                   transition-transform duration-500"
      />

      {/* Arrow */}
      <i
        className={`${iconClass} text-sm
                   transform transition-transform duration-300 delay-150
                   group-hover:-translate-x-1`}
      />

      <span>{text}</span>
    </button>
  );
};
