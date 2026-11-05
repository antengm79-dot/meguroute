import { HashRouter, Route, Routes } from "react-router-dom";
import { StoreProvider } from "./store";
import Home from "./screens/Home";
import Plan from "./screens/Plan";
import Questions from "./screens/Questions";
import Results from "./screens/Results";
import RoutePreview from "./screens/RoutePreview";
import Trip from "./screens/Trip";
import Camera from "./screens/Camera";
import TripEnd from "./screens/TripEnd";
import Vlog from "./screens/Vlog";
import Publish from "./screens/Publish";
import Feed from "./screens/Feed";
import RouteDetail from "./screens/RouteDetail";
import MyPage from "./screens/MyPage";
import Dress from "./screens/Dress";
import Follow from "./screens/Follow";
import Admin from "./screens/Admin";

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <div className="shell">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/plan/questions" element={<Questions />} />
            <Route path="/plan/results" element={<Results />} />
            <Route path="/plan/route" element={<RoutePreview />} />
            <Route path="/trip" element={<Trip />} />
            <Route path="/camera" element={<Camera />} />
            <Route path="/trip/end" element={<TripEnd />} />
            <Route path="/vlog" element={<Vlog />} />
            <Route path="/publish" element={<Publish />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/route/:id" element={<RouteDetail />} />
            <Route path="/me" element={<MyPage />} />
            <Route path="/dress" element={<Dress />} />
            <Route path="/follow" element={<Follow />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </HashRouter>
    </StoreProvider>
  );
}
