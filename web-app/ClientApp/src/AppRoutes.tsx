import { Questions } from "./components/Questions";
import { Home } from "./components/Home";
import { Documentation } from "./components/Documentation";

const AppRoutes = [
  {
    index: true,
    element: <Home />
  },
  {
    path: '/questions',
    element: <Questions/>
  },
  {
    path: '/documentation/:coursecode?',
    element: <Documentation/>
  }
];

export default AppRoutes;
