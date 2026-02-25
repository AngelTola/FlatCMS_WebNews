import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/posts')
      .then(response => response.json())
      .then(data => setPosts(data.posts))
      .catch(error => console.error('Error cargando posts:', error));
  }, []);

  return (
    <div className="App">
      <header className="header">
        <h1>Ultimas Noticias</h1>
      </header>

      <main className="contenedor-noticias">
        {posts.length > 0 ? (
          posts.map((post) => (
            <article key={post.id} className="tarjeta-noticia">
              {/* Si hay imagen, la cargamos desde el backend */}
              {post.imagen && (
                <img
                  src={`http://localhost:3001/img/${post.imagen}`}
                  alt={post.titulo}
                  className="imagen-noticia"
                />
              )}
              <div className="contenido-noticia">
                <span className="fecha-noticia">{post.fecha}</span>
                <h2>{post.titulo}</h2>
                <p>{post.resumen}</p>
                <button className="btn-leer-mas">Leer mas</button>
              </div>
            </article>
          ))
        ):(
          <p>Cargando noticias...</p>
        )}
      </main>
    </div>
  )
}

export default App