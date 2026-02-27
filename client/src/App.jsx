import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';

function TarjetaNoticia({ post }) {
  const [expandido, setExpandido] = useState(false);
  const [contenidoCompleto, setContenidoCompleto] = useState("");
  const [cargando, setCargando] = useState(false);

  const manejarClick = () => {
    if (expandido) {
      setExpandido(false);
      return;
    }

    if (!contenidoCompleto) {
      setCargando(true);
      fetch(`http://localhost:3001/api/posts/${post.id}`)
        .then(res => res.json())
        .then(data => {
          setContenidoCompleto(data.contenido);
          setCargando(false);
          setExpandido(true);
        })
        .catch(err => {
          console.error("Error", err);
          setCargando(false);
        });
    } else {
      setExpandido(true);
    }
  };

  return (
    <article className="tarjeta-noticia">
      {post.imagen && (
        <img src={`http://localhost:3001/img/${post.imagen}`} alt={post.titulo} className="imagen-noticia" />
      )}
      <div className="contenido-noticia">
        <span className="fecha-noticia">{post.fecha}</span>
        <h2>{post.titulo}</h2>
        
        <div className="texto-noticia">
          {expandido ? (
            <div className="texto-markdown">
              {cargando ? <p>Cargando...</p> : <ReactMarkdown>{contenidoCompleto}</ReactMarkdown>}
            </div>
          ) : (
            <p>{post.resumen}</p>
          )}
        </div>
        <button className="btn-leer-mas" onClick={manejarClick}>
          {expandido ? 'Ocultar' : 'Ver mas'}
        </button>
      </div>
    </article>
  );
}

function App() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/posts')
      .then(response => response.json())
      .then(data => setPosts(data.posts))
      .catch(error => console.error('Error:', error));
  }, []);

  return (
    <div className="App">
      <header className="header">
        <h1>Noticias</h1>
      </header>
      
      <main className="contenedor-noticias">
        {posts.length > 0 ? (
          posts.map((post) => (
            <TarjetaNoticia key={post.id} post={post} />
          ))
        ) : (
          <p>Cargando noticias...</p>
        )}
      </main>
    </div>
  );
}

export default App;