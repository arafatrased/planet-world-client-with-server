import { Navigate } from "react-router-dom"
import LoadingSpinner from "../components/Shared/LoadingSpinner"
import PropTypes from "prop-types"
import useRole from "../hooks/useRole"


const AdminRoute = ({children}) => {
    const [role, isLoading] = useRole()
    // const location = useLocation()
  
    if (isLoading) return <LoadingSpinner />
    if (role === 'admin') return children
    return <Navigate to='/dashboard' replace='true' />
    // state={{ from: location }}
  }
  
  AdminRoute.propTypes = {
    children: PropTypes.element,
};

export default AdminRoute;