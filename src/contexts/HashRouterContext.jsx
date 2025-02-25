import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const HashRouterContext = createContext();

export function HashRouterProvider({ children }) {
  const [hash, setHash] = useState(window.location.hash.substring(1) || '');
  const [params, setParams] = useState({
    year: '2022',
    button: 'mid',
    cunliCode: ''
  });

  // 解析 hash 為參數
  const parseHash = useCallback((hashString) => {
    const parts = hashString.split('/');
    if (parts.length >= 3) {
      setParams({
        year: parts[0],
        button: parts[1],
        cunliCode: parts[2]
      });
    }
  }, []);

  // 設置 hash
  const setHashValue = useCallback((year, button, cunliCode) => {
    const newHash = `#${year}/${button}/${cunliCode}`;
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
      setHash(newHash.substring(1));
      setParams({ year, button, cunliCode });
    }
  }, []);

  // 監聽 hash 變更
  useEffect(() => {
    const handleHashChange = () => {
      const newHash = window.location.hash.substring(1);
      setHash(newHash);
      parseHash(newHash);
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // 初始解析
    if (hash) {
      parseHash(hash);
    }
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [hash, parseHash]);

  return (
    <HashRouterContext.Provider value={{
      hash,
      params,
      setHashValue
    }}>
      {children}
    </HashRouterContext.Provider>
  );
}

export function useHashRouter() {
  const context = useContext(HashRouterContext);
  if (!context) {
    throw new Error('useHashRouter must be used within a HashRouterProvider');
  }
  return context;
} 