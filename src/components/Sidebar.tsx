"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FC, useState, ReactElement } from "react";
import {
  FiHome,
  FiUser,
  FiUsers,
  FiShoppingBag,
  FiList,
  FiDollarSign,
  FiCreditCard,
  FiEdit,
  FiChevronRight,
  FiPackage,
  FiRefreshCw,
} from "react-icons/fi";
import { motion } from "framer-motion";

interface NavItemProps {
  href: string;
  icon: ReactElement;
  label: string;
  isActive: boolean;
}

const NavItem: FC<NavItemProps> = ({ href, icon, label, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={href}
      className="block relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        initial={false}
        animate={{
          backgroundColor: isActive
            ? "rgb(224 242 254)" // sky-100
            : isHovered
            ? "rgba(255, 255, 255, 0.08)"
            : "transparent",
          color: isActive
            ? "rgb(3 105 161)" // sky-800
            : "rgb(240 249 255)", // sky-50
          y: isHovered && !isActive ? -2 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium"
      >
        <span className="text-lg">{icon}</span>
        <span>{label}</span>

        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}

        <motion.span
          animate={{
            opacity: isHovered ? 1 : 0,
            x: isHovered ? 0 : -4,
            rotate: isHovered ? 0 : -45,
          }}
          transition={{ duration: 0.2 }}
          className="ml-auto"
        >
          <FiChevronRight
            className={`${isActive ? "text-sky-700" : "text-sky-100"}`}
          />
        </motion.span>
      </motion.div>
    </Link>
  );
};

const Sidebar: FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: <FiHome />, label: "Início" },
    { href: "/cadastrar-matriz", icon: <FiUser />, label: "Cadastrar Matriz" },
    {
      href: "/cadastrar-filiado",
      icon: <FiUsers />,
      label: "Cadastrar Filiado",
    },
    {
      href: "/adicionar-compra",
      icon: <FiShoppingBag />,
      label: "Adicionar Compra",
    },
    {
      href: "/historico-compras",
      icon: <FiList />,
      label: "Histórico de Compras",
    },
    {
      href: "/cartao-fidelidade",
      icon: <FiCreditCard />,
      label: "Cartão Fidelidade",
    },
    { href: "/editar-cliente", icon: <FiEdit />, label: "Editar Cliente" },
    { href: "/produtos", icon: <FiPackage />, label: "Produtos Online" },
    {
      href: "/atualizar-valores",
      icon: <FiRefreshCw />,
      label: "Atualizar Valores",
    },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-indigo-900 to-indigo-700 min-h-screen p-6 shadow-xl relative overflow-hidden">
      {/* Elemento decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full opacity-10 transform translate-x-16 -translate-y-16" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-950 rounded-full opacity-10 transform -translate-x-20 translate-y-20" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 relative"
      >
        <h1 className="text-2xl font-bold mb-1 text-white">EcoClean</h1>
        <p className="text-sky-200 text-sm">Sistema de Fidelidade</p>
      </motion.div>

      <nav className="space-y-1 relative">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href}
          />
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
