import { NavLink, Outlet } from "react-router-dom";

function Layout() {

    return (
        <div className="app-layout">

            <aside className="sidebar">

                <h1 className="logo">
                    IntelliFit
                </h1>

                <nav>

                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            isActive ? "nav-link active" : "nav-link"
                        }
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/foods"
                        className={({ isActive }) =>
                            isActive ? "nav-link active" : "nav-link"
                        }
                    >
                        Alimentos
                    </NavLink>

                    <NavLink
                        to="/recipes"
                        className={({ isActive }) =>
                            isActive ? "nav-link active" : "nav-link"
                        }
                    >
                        Receitas
                    </NavLink>

                    <NavLink
                        to="/chat"
                        className={({ isActive }) =>
                            isActive ? "nav-link active" : "nav-link"
                        }
                    >
                        Chat
                    </NavLink>

                    <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                            isActive
                                ? "nav-link active"
                                : "nav-link"
                        }
                    >
                        Perfil
                    </NavLink>

                </nav>

                <button
                    className="logout-button"
                    onClick={() => {
                        localStorage.removeItem("token");
                        window.location.href = "/login";
                    }}
                >
                    Sair
                </button>

            </aside>

            <main className="main-content">

                <Outlet />

            </main>

        </div>
    );
}

export default Layout;