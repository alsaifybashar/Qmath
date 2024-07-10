import { Questions } from "./components/Questions";
import { Home } from "./components/Home";

const AppRoutes = [
  {
    index: true,
    element: <Home />
  },
  {
    path: '/questions',
    element: <Questions/>
  }
];

export default AppRoutes;
