import{ createBrowserRouter }  from "react-router-dom"
import MenuSection from "./components/MenuSection.jsx"

const router = createBrowserRouter([{
    path:"/",
    element:<Landingpage/>
},
{
    path:"/dinein",
    element:<MenuSection/>
}
]);