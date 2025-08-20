import { useState, useEffect } from 'react';

export function useCharacters(category = null) {
    const [data, setData] = useState({
        characters: [],
        loading: true,
        error: null
    });

    useEffect(() => {
        const fetchCharacters = async () => {
            try {
                setData(prev => ({ ...prev, loading: true, error: null }));
                
                const params = new URLSearchParams({
                    limit: '1000' // 获取所有角色
                });
                
                if (category) {
                    params.set('category', category);
                }
                
                const response = await fetch(`/api/characters?${params}`);
                
                if (!response.ok) {
                    throw new Error('获取角色数据失败');
                }
                
                const result = await response.json();
                
                setData({
                    characters: result.characters,
                    loading: false,
                    error: null
                });
                
            } catch (error) {
                setData(prev => ({
                    ...prev,
                    loading: false,
                    error: error.message
                }));
            }
        };

        fetchCharacters();
    }, [category]);

    return data;
}

export function useCategories() {
    const [data, setData] = useState({
        categories: [],
        loading: true,
        error: null
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setData(prev => ({ ...prev, loading: true, error: null }));
                
                const response = await fetch('/api/categories');
                
                if (!response.ok) {
                    throw new Error('获取分类数据失败');
                }
                
                const result = await response.json();
                
                setData({
                    categories: result.categories,
                    loading: false,
                    error: null
                });
                
            } catch (error) {
                setData(prev => ({
                    ...prev,
                    loading: false,
                    error: error.message
                }));
            }
        };

        fetchCategories();
    }, []);

    return data;
}