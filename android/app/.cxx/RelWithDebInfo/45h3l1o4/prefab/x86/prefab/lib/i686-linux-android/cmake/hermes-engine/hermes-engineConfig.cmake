if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/stevenmuganwa/.gradle/caches/transforms-3/92e8b0f660cacc4a49ba1ca5bd31bfa3/transformed/jetified-hermes-android-0.72.1-release/prefab/modules/libhermes/libs/android.x86/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/stevenmuganwa/.gradle/caches/transforms-3/92e8b0f660cacc4a49ba1ca5bd31bfa3/transformed/jetified-hermes-android-0.72.1-release/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

