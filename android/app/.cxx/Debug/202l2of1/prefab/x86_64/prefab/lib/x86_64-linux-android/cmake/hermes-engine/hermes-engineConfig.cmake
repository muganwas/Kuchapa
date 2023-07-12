if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/stevenmuganwa/.gradle/caches/transforms-3/8e077358ae86a89734796601e25ee52a/transformed/jetified-hermes-android-0.72.1-debug/prefab/modules/libhermes/libs/android.x86_64/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/stevenmuganwa/.gradle/caches/transforms-3/8e077358ae86a89734796601e25ee52a/transformed/jetified-hermes-android-0.72.1-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

