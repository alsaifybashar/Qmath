import { Questions } from "./components/pages/Questions";
import { Home } from "./components/pages/Home";
import { Documentation } from "./components/pages/Documentation";
import Editor from "./components/pages/Editor";
import Login from "./components/pages/Login";

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
  ,{
    path: "/editor",
    element: <Editor/>
  }
  ,{
    path: "/login",
    element: <Login/>
  }
];

export default AppRoutes;
