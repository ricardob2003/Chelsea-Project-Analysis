import { Navigate, createBrowserRouter } from "react-router-dom";

import { AppShell } from "../components/AppShell";
import { ChelseaVsBenchmark } from "../pages/ChelseaVsBenchmark";
import { PitchWeaknessMap } from "../pages/PitchWeaknessMap";
import { RecruitmentBoard } from "../pages/RecruitmentBoard";
import { U22FitFilter } from "../pages/U22FitFilter";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/benchmark" replace /> },
      { path: "benchmark", element: <ChelseaVsBenchmark /> },
      { path: "pitch-weakness", element: <PitchWeaknessMap /> },
      { path: "recruitment-board", element: <RecruitmentBoard /> },
      { path: "u22-fit", element: <U22FitFilter /> }
    ]
  }
]);
